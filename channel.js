// A station and display pair must both match the phone scan.
const vikingParams = new URLSearchParams(window.location.search);
window.vikingPair = vikingParams.get('pair') ?? '1';
window.vikingPairValid = ['1', '2', '3'].includes(window.vikingPair);
window.vikingStation = document.body.dataset.page || vikingParams.get('station');
window.vikingStationValid = ['start', 'seasons', 'weapons', 'result'].includes(window.vikingStation);
window.vikingChannel = window.vikingStationValid && window.vikingPairValid
    ? `build-a-viking-hackathon-2026-${window.vikingStation}-${window.vikingPair}` : null;

window.vikingToken = vikingParams.get('token') || '';
window.vikingTokenValid = /^[A-Za-z0-9_-]{1,80}$/.test(window.vikingToken);
