(() => {
  const locations = {
    "1": {
      "title": "Station 1: Harald's Great Rune Stone",
      "story": "I am the serpent carved onto this boulder in 965 AD. Here King Harald Bluetooth united Denmark and honored his parents, Gorm and Thyra.",
      "direction": "👉 <strong>Look at the South Face:</strong> Find my body coiled around the great beast, then walk north to <strong>Station 2 (Gorm's Mound)</strong>."
    },
    "2": {
      "title": "Station 2: King Gorm's Burial Mound",
      "story": "Beneath this mound lay the oak burial chamber of King Gorm the Old, guarding the silver Jelling Cup.",
      "direction": "👉 <strong>Look at the display case:</strong> Spot the S-shaped ribbon dragon on the silver cup, then head to <strong>Station 3 (The Stone Ship)</strong>."
    },
    "3": {
      "title": "Station 3: The 356m Viking Stone Ship",
      "story": "You stand inside the largest stone ship ever built by Vikings, enclosed by a massive royal oak palisade.",
      "direction": "👉 <strong>Follow the stone markers:</strong> Trace the hull lines stretching across the museum grounds, or return to <strong>Station 1 (Harald's Great Rune Stone)</strong>."
    }
  };

  const locationId = window.jellingPair;
  const statusText = document.getElementById("stone-status");
  const hint = document.getElementById("stone-sub");
  const station = locations[locationId];
  if (!station) {
    statusText.textContent = "Choose a location";
    hint.textContent = "Use location.html?pair=1, 2 or 3.";
    document.getElementById("stone-view").removeAttribute("onclick");
    return;
  }
  document.title = `${station.title} | Jelling Guide`;
  document.getElementById("station-title").textContent = station.title;
  document.getElementById("station-story").textContent = station.story;
  document.getElementById("station-direction").innerHTML = station.direction;
  let resetTimer;
  let personNear = false;

  function resetToSleep() {
    clearTimeout(resetTimer);
    resetTimer = null;
    document.body.className = personNear ? "state-glow" : "state-sleep";
    statusText.textContent = personNear
      ? `Person detected. Location ${locationId}`
      : `Waiting for visitor or NFC scan. Location ${locationId}`;
  }

  function showState(state) {
    clearTimeout(resetTimer);
    document.body.className = `state-${state}`;
    statusText.textContent = `NFC scanned! Location ${locationId}`;
    resetTimer = setTimeout(resetToSleep, 30000);
  }

  function activatePanel() {
    showState("active");
  }

  // Original hook used by the proximity controller.
  window.setGlowState = (isNear) => {
    personNear = Boolean(isNear);
    // A camera update must not interrupt a scan glow or an open story.
    if (!resetTimer) resetToSleep();
  };

  window.resetToSleep = resetToSleep;
  window.activatePanel = activatePanel;
  resetToSleep();
  hint.textContent = "Connecting…";
  const events = new EventSource(`https://ntfy.sh/${window.jellingChannel}/sse`);
  events.onopen = () => {
    hint.textContent = "Ready. Scan this location’s NFC tag";
  };
  events.onerror = () => {
    hint.textContent = "Disconnected. Reconnecting… Check the internet connection.";
  };
  events.onmessage = (event) => {
    try {
      const command = JSON.parse(event.data)?.message;
      if (typeof command !== "string") return;
      if (command.trim() === `UNLOCK_${locationId}`) showState("glow");
      if (command.trim() === "GLOW_ON") window.setGlowState(true);
      if (command.trim() === "GLOW_OFF") window.setGlowState(false);
    } catch {
      // Ignore non-message events.
    }
  };

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "g") showState("glow");
    if (event.key === "Escape") resetToSleep();
  });
})();
