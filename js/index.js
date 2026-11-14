const CHANNEL = "jelling-snake-hackathon-2026";
const LOCATION_PAGES = {
  "1": "location1.html?location=1",
  "2": "location2.html?location=2",
  "3": "location3.html?location=3"
};

const params = new URLSearchParams(window.location.search);
const requestedLoc = params.get("location") || params.get("loc");

if (requestedLoc && LOCATION_PAGES[requestedLoc]) {
  window.location.replace(LOCATION_PAGES[requestedLoc]);
}

function setGlowState(isNear) {
  document.body.classList.toggle("state-glow", Boolean(isNear));
}

function resetToSleep() {
  document.body.classList.remove("state-glow");
}

function goToLocation(id) {
  if (LOCATION_PAGES[id]) {
    window.location.href = LOCATION_PAGES[id];
  }
}

// Tapping the screen shows the text and sends the snake across
function showTapText() {
  document.getElementById("tap-text").classList.add("visible");
  window.SnakeAnimation?.play();
}

document.addEventListener("click", showTapText);

const eventSource = new EventSource(`https://ntfy.sh/${CHANNEL}/sse`);
eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    const command = (data.message || "").trim();

    if (command === "GLOW_ON") setGlowState(true);
    else if (command === "GLOW_OFF") setGlowState(false);
    else if (command === "UNLOCK_1") window.location.href = `${LOCATION_PAGES["1"]}&remote=1`;
    else if (command === "UNLOCK_2") window.location.href = `${LOCATION_PAGES["2"]}&remote=1`;
    else if (command === "UNLOCK_3") window.location.href = `${LOCATION_PAGES["3"]}&remote=1`;
  } catch (e) {}
};

window.setGlowState = setGlowState;
window.resetToSleep = resetToSleep;
window.goToLocation = goToLocation;
