(() => {
  const STORAGE_KEY = "jelling_visitor_answers";

  const locations = {
    "1": {
      title: "Station 1: Harald's Great Rune Stone",
      story: "I am the serpent carved onto this boulder in 965 AD. Here King Harald Bluetooth united Denmark and honored his parents, Gorm and Thyra.",
      direction: "👉 <strong>Look at the South Face:</strong> Find my body coiled around the great beast, then walk north to <strong>Station 2 (Gorm's Mound)</strong>.",
      mcq: {
        question: "Who raised this Great Rune Stone in 965 AD to unite Denmark?",
        options: [
          "A) King Ragnar Lothbrok",
          "B) King Harald Bluetooth",
          "C) King Sweyn Forkbeard"
        ],
        correctIndex: 1
      }
    },
    "2": {
      title: "Station 2: King Gorm's Burial Mound",
      story: "Beneath this mound lay the oak burial chamber of King Gorm the Old, guarding the silver Jelling Cup.",
      direction: "👉 <strong>Look at the display case:</strong> Spot the S-shaped ribbon dragon on the silver cup, then head to <strong>Station 3 (The Stone Ship)</strong>.",
      mcq: {
        question: "What artifact was guarded inside King Gorm's burial chamber?",
        options: [
          "A) The Silver Jelling Cup",
          "B) Thor's Golden Hammer",
          "C) The Ring of Odin"
        ],
        correctIndex: 0
      }
    },
    "3": {
      title: "Station 3: The 356m Viking Stone Ship",
      story: "You stand inside the largest stone ship ever built by Vikings, enclosed by a massive royal oak palisade.",
      direction: "👉 <strong>Follow the stone markers:</strong> Trace the hull lines stretching across the museum grounds, or return to <strong>Station 1 (Harald's Great Rune Stone)</strong>.",
      mcq: {
        question: "How long is the massive Viking Stone Ship you stand inside?",
        options: [
          "A) 120 meters",
          "B) 240 meters",
          "C) 356 meters"
        ],
        correctIndex: 2
      }
    }
  };

  // Global variable storing MCQ answers per NFC token ID across all stations
  window.visitorAnswers = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  window.currentVisitorToken = window.jellingToken || "token1";

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

  function saveAnswerLocally(token, stationId, answerData) {
    if (!window.visitorAnswers[token]) {
      window.visitorAnswers[token] = {};
    }
    window.visitorAnswers[token][stationId] = answerData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.visitorAnswers));
    if (token === window.currentVisitorToken) {
      renderMCQ();
      renderSummary();
    }
  }

  function recordMCQAnswer(choiceIndex) {
    const token = window.currentVisitorToken;
    const mcq = station.mcq;
    const answerData = {
      choiceIndex,
      choiceText: mcq.options[choiceIndex],
      correct: choiceIndex === mcq.correctIndex,
      timestamp: Date.now()
    };

    saveAnswerLocally(token, locationId, answerData);

    // Restart inactivity timer on interaction
    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetToSleep, 45000);

    // Broadcast to global state channel so all stations share window.visitorAnswers
    fetch(`https://ntfy.sh/${window.jellingStateChannel}`, {
      method: "POST",
      body: JSON.stringify({
        type: "MCQ_ANSWER",
        token,
        station: locationId,
        answerData
      })
    }).catch(() => {});
  }

  function renderMCQ() {
    const token = window.currentVisitorToken;
    document.getElementById("active-token-badge").textContent = `Serpent Token: ${token}`;

    const mcq = station.mcq;
    const questionEl = document.getElementById("mcq-question");
    const optionsEl = document.getElementById("mcq-options");
    const feedbackEl = document.getElementById("mcq-feedback");

    questionEl.textContent = mcq.question;
    optionsEl.innerHTML = "";

    const existing = window.visitorAnswers[token]?.[locationId];

    mcq.options.forEach((optText, idx) => {
      const btn = document.createElement("button");
      btn.className = "mcq-btn";
      btn.textContent = optText;

      if (existing && existing.choiceIndex === idx) {
        btn.classList.add(existing.correct ? "selected-correct" : "selected-wrong");
      }

      btn.addEventListener("click", () => recordMCQAnswer(idx));
      optionsEl.appendChild(btn);
    });

    if (existing) {
      feedbackEl.style.color = existing.correct ? "#86efac" : "#fca5a5";
      feedbackEl.textContent = existing.correct
        ? `✓ Correct! Saved for token "${token}".`
        : `✗ Saved "${existing.choiceText}" for token "${token}".`;
    } else {
      feedbackEl.textContent = "";
    }
  }

  function renderSummary() {
    const token = window.currentVisitorToken;
    const tokenData = window.visitorAnswers[token] || {};
    const summaryTitle = document.getElementById("summary-title");
    const summaryList = document.getElementById("summary-list");

    const answeredCount = Object.keys(tokenData).length;
    const correctCount = Object.values(tokenData).filter((a) => a.correct).length;

    summaryTitle.textContent = `Progress for Token "${token}" (${answeredCount}/3 Stations Answered — Score: ${correctCount}/3)`;
    summaryList.innerHTML = "";

    ["1", "2", "3"].forEach((stId) => {
      const li = document.createElement("li");
      const ans = tokenData[stId];
      if (ans) {
        li.textContent = `Station ${stId}: ${ans.choiceText} (${ans.correct ? "✓ Correct" : "✗ Incorrect"})`;
      } else {
        li.textContent = `Station ${stId}: Not answered yet`;
        li.style.color = "#64748b";
      }
      summaryList.appendChild(li);
    });
  }

  function resetToSleep() {
    clearTimeout(resetTimer);
    document.body.className = "state-sleep";
    statusText.textContent = `Waiting for NFC scan — Location ${locationId}`;
  }

  function showState(state) {
    clearTimeout(resetTimer);
    document.body.className = `state-${state}`;
    statusText.textContent = `NFC scanned (${window.currentVisitorToken}) — Location ${locationId}`;
    if (state === "active") {
      renderMCQ();
      renderSummary();
    }
    resetTimer = setTimeout(resetToSleep, 45000);
  }

  function activatePanel() {
    showState("active");
  }

  window.setGlowState = (isNear) => {
    if (document.body.className === "state-active") return;
    if (isNear) {
      showState("glow");
      statusText.textContent = `The Runestone Awakens! — Location ${locationId}`;
    } else {
      resetToSleep();
    }
  };

  window.resetToSleep = resetToSleep;
  window.activatePanel = activatePanel;
  resetToSleep();

  // Load recent global MCQ answers from ntfy state channel history
  fetch(`https://ntfy.sh/${window.jellingStateChannel}/json?poll=1`)
    .then((res) => res.text())
    .then((lines) => {
      lines.split("\n").forEach((line) => {
        if (!line.trim()) return;
        try {
          const eventObj = JSON.parse(line);
          const payload = JSON.parse(eventObj.message || "{}");
          if (payload.type === "MCQ_ANSWER" && payload.token && payload.station) {
            saveAnswerLocally(payload.token, payload.station, payload.answerData);
          }
        } catch {}
      });
    })
    .catch(() => {});

  // Subscribe to live global MCQ answers across all stations
  const stateEvents = new EventSource(`https://ntfy.sh/${window.jellingStateChannel}/sse`);
  stateEvents.onmessage = (event) => {
    try {
      const eventObj = JSON.parse(event.data);
      const payload = JSON.parse(eventObj.message || "{}");
      if (payload.type === "MCQ_ANSWER" && payload.token && payload.station) {
        saveAnswerLocally(payload.token, payload.station, payload.answerData);
      }
    } catch {}
  };

  hint.textContent = "Connecting…";
  const events = new EventSource(`https://ntfy.sh/${window.jellingChannel}/sse`);
  events.onopen = () => {
    hint.textContent = "Ready — scan your Norse Serpent NFC token";
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
        window.setGlowState(true);
      } else if (trimmed === "GLOW_OFF") {
        window.setGlowState(false);
      }
    } catch {}
  };

  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "g") showState("glow");
    if (event.key === "Escape") resetToSleep();
  });
})();
