// Shared by location1.html, location2.html and location3.html.
// Each page sets its own number with <body data-location="N">.
const CHANNEL = "jelling-snake-hackathon-2026";
const LOCATION_ID = document.body.dataset.location;
const params = new URLSearchParams(window.location.search);
const isRemote = params.get("remote") === "1";

if (!isRemote) {
  fetch(`https://ntfy.sh/${CHANNEL}`, { method: "POST", body: `UNLOCK_${LOCATION_ID}` }).catch(() => {});
}

function setGlowState(isNear) {
  document.body.classList.toggle("state-glow", Boolean(isNear));
}

// Runs on every tap (and on a remote unlock for this location):
// shows the text and sends the snake across
function activatePanel() {
  document.body.classList.add("state-tapped");
  document.getElementById("tap-text").classList.add("visible");
  window.SnakeAnimation?.play();
}

function resetToSleep() {
  document.body.classList.remove("state-glow", "state-tapped");
  document.getElementById("tap-text").classList.remove("visible");
}

document.addEventListener("click", activatePanel);

const eventSource = new EventSource(`https://ntfy.sh/${CHANNEL}/sse`);
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    const command = (data.message || "").trim();
    const match = command.match(/^UNLOCK_([123])$/);

    if (command === "GLOW_ON") setGlowState(true);
    else if (command === "GLOW_OFF") setGlowState(false);
    else if (match && match[1] === LOCATION_ID) activatePanel();
    else if (match) window.location.href = `location${match[1]}.html?location=${match[1]}&remote=1`;
  } catch (e) {}
};

window.setGlowState = setGlowState;
window.activatePanel = activatePanel;
window.resetToSleep = resetToSleep;
