(() => {
  const STORAGE_KEY = "jelling_visitor_answers";

  const locations = {
    "1": {
      question: "WHAT IS YOUR FAVORITE SEASON?",
      options: ["SUMMER", "FALL", "WINTER", "SPRING"],
      icons: {
        SUMMER: "picture/clothing/striped-tunic.png",
        FALL: "picture/clothing/fur-tunic.png",
        WINTER: "picture/clothing/fur-cloak.png",
        SPRING: "picture/clothing/belted-tunic.png"
      }
    },
    "2": {
      question: "VIKING, CHOOSE YOUR WEAPON!",
      options: ["SPEAR", "SWORD", "AXE", "KNIFE"],
      icons: {
        SPEAR: "picture/weapons/spear.png",
        SWORD: "picture/weapons/sword.png",
        AXE: "picture/weapons/axe.png",
        KNIFE: "picture/weapons/knife.png"
      }
    },
    "3": {
      question: "WHO WILL BE YOUR MENTOR?",
      options: ["GORM THE OLD", "KNUD", "THYRA", "NO ONE"],
      icons: {
        "GORM THE OLD": "picture/mentors/drinking-horn.png",
        KNUD: "picture/mentors/helmet.png",
        THYRA: "picture/mentors/hooded-cloak.png",
        "NO ONE": "picture/mentors/arm-wraps.png"
      }
    }
  };

  window.visitorAnswers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  window.currentVisitorToken = window.jellingToken;

  const locationId = window.jellingPair;
  const statusText = document.getElementById("stone-status");
  const hint = document.getElementById("stone-sub");
  const proceedMsg = document.getElementById("proceed-msg");
  const station = locations[locationId];

  if (!station) {
    statusText.textContent = "Choose a location";
    hint.textContent = "Use location.html?pair=1, 2 or 3.";
    document.getElementById("stone-view").removeAttribute("onclick");
    return;
  }

  let resetTimer;

  // TEMP for testing: add &test=1 to the URL to skip the NFC scan and
  // stay on the question (no 30s auto-reset). Remove before going live.
  const testMode = new URLSearchParams(window.location.search).get("test") === "1";

  function saveAnswerLocally(token, stationId, answer) {
    if (!window.visitorAnswers[token]) {
      window.visitorAnswers[token] = {};
    }
    window.visitorAnswers[token][stationId] = answer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.visitorAnswers));
  }

  function recordMCQAnswer(choiceText) {
    const token = window.currentVisitorToken;
    saveAnswerLocally(token, locationId, choiceText);
    renderMCQ();
    proceedMsg.hidden = false;

    clearTimeout(resetTimer);
    if (!testMode) resetTimer = setTimeout(resetToSleep, 30000);

    fetch(`https://ntfy.sh/${window.jellingStateChannel}`, {
      method: "POST",
      body: JSON.stringify({
        type: "MCQ_ANSWER",
        token,
        station: locationId,
        answer: choiceText
      })
    }).catch(() => {});
  }

  function renderMCQ() {
    const token = window.currentVisitorToken;
    const questionEl = document.getElementById("mcq-question");
    const optionsEl = document.getElementById("mcq-options");

    questionEl.textContent = station.question;
    optionsEl.innerHTML = "";

    const existing = window.visitorAnswers[token]?.[locationId];

    station.options.forEach((optText) => {
      const btn = document.createElement("button");
      btn.className = "mcq-btn";

      const icon = station.icons?.[optText];
      if (icon) {
        btn.classList.add("has-icon");
        const badge = document.createElement("span");
        badge.className = "mcq-badge";
        const img = document.createElement("img");
        img.src = icon;
        img.alt = "";
        badge.appendChild(img);
        btn.appendChild(badge);
      }

      const label = document.createElement("span");
      label.className = "mcq-label";
      label.textContent = optText;
      btn.appendChild(label);

      if (existing === optText) {
        btn.classList.add("selected");
      }

      btn.addEventListener("click", () => recordMCQAnswer(optText));
      optionsEl.appendChild(btn);
    });
  }

  function resetToSleep() {
    clearTimeout(resetTimer);
    proceedMsg.hidden = true;
    document.body.className = "state-sleep";
    statusText.textContent = `Waiting for NFC scan — Location ${locationId}`;
  }

  function showState(state) {
    clearTimeout(resetTimer);
    document.body.className = `state-${state}`;
    statusText.textContent = `NFC scanned — Location ${locationId}`;
    if (state === "active") {
      proceedMsg.hidden = true;
      renderMCQ();
    }
    if (!testMode) resetTimer = setTimeout(resetToSleep, 30000);
  }

  window.showState = showState;
  if (testMode) {
    showState("active");
  } else {
    resetToSleep();
  }

  fetch(`https://ntfy.sh/${window.jellingStateChannel}/json?poll=1`)
    .then((res) => res.text())
    .then((lines) => {
      lines.split("\n").forEach((line) => {
        if (!line.trim()) return;
        try {
          const payload = JSON.parse(JSON.parse(line).message || "{}");
          if (payload.type === "MCQ_ANSWER" && payload.token && payload.station && payload.answer) {
            saveAnswerLocally(payload.token, payload.station, payload.answer);
          }
        } catch {}
      });
    })
    .catch(() => {});

  const stateEvents = new EventSource(`https://ntfy.sh/${window.jellingStateChannel}/sse`);
  stateEvents.onmessage = (event) => {
    try {
      const payload = JSON.parse(JSON.parse(event.data).message || "{}");
      if (payload.type === "MCQ_ANSWER" && payload.token && payload.station && payload.answer) {
        saveAnswerLocally(payload.token, payload.station, payload.answer);
      }
    } catch {}
  };

  hint.textContent = "Connecting…";
  const events = new EventSource(`https://ntfy.sh/${window.jellingChannel}/sse`);
  events.onopen = () => {
    hint.textContent = "Ready — scan this location’s NFC tag";
  };
  events.onerror = () => {
    hint.textContent = "Disconnected — reconnecting… Check the internet connection.";
  };
  events.onmessage = (event) => {
    try {
      const rawMessage = JSON.parse(event.data)?.message;
      if (typeof rawMessage !== "string") return;
      const trimmed = rawMessage.trim();

      if (trimmed.startsWith(`UNLOCK_${locationId}`)) {
        const parts = trimmed.split(":");
        if (parts[1]) {
          window.currentVisitorToken = parts[1].trim();
        }
        showState("active");
      } else if (trimmed === "GLOW_ON") {
        if (document.body.className !== "state-active") {
          showState("glow");
          statusText.textContent = `The Runestone Awakens! — Location ${locationId}`;
        }
      } else if (trimmed === "GLOW_OFF") {
        if (document.body.className !== "state-active") {
          resetToSleep();
        }
      }
    } catch {}
  };
})();
