// Use the same pair on the Viking display and its NFC tag. Default to station 1.
window.vikingPair = new URLSearchParams(window.location.search).get('pair') ?? '1';
window.vikingPairValid = ['1', '2', '3'].includes(window.vikingPair);
window.vikingChannel = `build-a-viking-hackathon-2026-${window.vikingPair}`;
