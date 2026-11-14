// Each laptop stays bound to the location declared in its HTML.
(() => {
  const CHANNEL = "jelling-snake-hackathon-2026";
  const locationId = document.body.dataset.location;
  const status = document.getElementById("stone-status");
  let inactivityTimer;

  function resetToSleep() {
    clearTimeout(inactivityTimer);
    document.body.className = "state-sleep";
    status.textContent = `Runestone Sleeping — Location ${locationId}`;
  }

  function setGlowState(isScanned) {
    if (!isScanned) {
      resetToSleep();
      return;
    }
    clearTimeout(inactivityTimer);
    document.body.className = "state-glow";
    status.textContent = `NFC tag scanned — Location ${locationId}`;
    inactivityTimer = setTimeout(resetToSleep, 30000);
  }

  // Keep the story available by tapping the display after a scan.
  function activatePanel() {
    clearTimeout(inactivityTimer);
    document.body.className = "state-active";
    inactivityTimer = setTimeout(resetToSleep, 30000);
  }

  window.resetToSleep = resetToSleep;
  window.setGlowState = setGlowState;
  window.activatePanel = activatePanel;

  const eventSource = new EventSource(`https://ntfy.sh/${CHANNEL}/sse`);
  eventSource.onmessage = (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    if (typeof data?.message !== "string") return;
    const command = data.message.trim();
    if (command === `UNLOCK_${locationId}` || command === `GLOW_ON_${locationId}`) {
      setGlowState(true);
    } else if (command === `GLOW_OFF_${locationId}`) {
      resetToSleep();
    }
  };

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "g") setGlowState(true);
    if (event.key === " ") {
      event.preventDefault();
      activatePanel();
    }
    if (event.key === "Escape") resetToSleep();
  });
})();
