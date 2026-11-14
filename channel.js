// The pair selects both the station content and its controller channel.
window.jellingPair = new URLSearchParams(window.location.search).get("pair");
window.jellingChannel = `jelling-snake-hackathon-2026-${window.jellingPair}`;
