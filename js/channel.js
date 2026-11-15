const params = new URLSearchParams(window.location.search);
window.jellingPair = params.get("pair");
window.jellingToken = params.get("token") || "token1";
window.jellingChannel = `jelling-snake-hackathon-2026-${window.jellingPair}`;
window.jellingStateChannel = "jelling-snake-state-2026";
