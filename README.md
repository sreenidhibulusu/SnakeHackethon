# Jelling displays

Only two pages are needed. The `pair` parameter selects the station (`1`, `2`, or `3`) and its channel, while the `token` parameter identifies the visitor's unique NFC Serpent token (e.g., `token1`, `token2`).

| Station (`pair`) | Laptop display URL | NFC Scan / Shortcut URL |
| --- | --- | --- |
| 1 | `location.html?pair=1` | `https://YOUR-HOST/scan.html?pair=1&token=token1` |
| 2 | `location.html?pair=2` | `https://YOUR-HOST/scan.html?pair=2&token=token1` |
| 3 | `location.html?pair=3` | `https://YOUR-HOST/scan.html?pair=3&token=token1` |

Include the hosted folder path in the URLs. For example:
`https://sreenidhibulusu.github.io/SnakeHackethon/scan.html?pair=1&token=token1`.

## Passing the NFC Token ID via Apple Shortcuts
In Apple Shortcuts (Automation → NFC), scan each visitor's NFC token and either:
- Open `https://sreenidhibulusu.github.io/SnakeHackethon/scan.html?pair=1&token=token1`, **or**
- Use **Get Contents of URL** (`POST` to `https://ntfy.sh/jelling-snake-hackathon-2026-1`) with the body `UNLOCK_1:token1` (use `token2`, `token3`, etc. for other visitor tokens).

## Global MCQ Answer Storage (`window.visitorAnswers`)
- Each station displays a multiple-choice question (MCQ) when unlocked by a visitor's NFC token.
- Answers are stored in the global variable `window.visitorAnswers[tokenId][stationId]` and automatically synced across all station laptops via `https://ntfy.sh/jelling-snake-state-2026` and `localStorage`.
- Each station's panel displays the active visitor's token ID (`window.currentVisitorToken`) and their combined progress/score across all 3 stations.
