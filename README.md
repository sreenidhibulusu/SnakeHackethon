# Jelling displays

Only two pages are needed. The `pair` parameter selects the station and its
channel. Use the same pair on the laptop, NFC tag and proximity controller.

| Pair | Laptop display | NFC tag URL |
| --- | --- | --- |
| 1 | `location.html?pair=1` | `https://YOUR-HOST/scan.html?pair=1` |
| 2 | `location.html?pair=2` | `https://YOUR-HOST/scan.html?pair=2` |
| 3 | `location.html?pair=3` | `https://YOUR-HOST/scan.html?pair=3` |

Include the hosted folder path in the URLs. For example:
`https://sreenidhibulusu.github.io/SnakeHackethon/scan.html?pair=3`.

Update existing NFC tags from `locationN.html` to the matching `scan.html?pair=N`
URL. The old numbered pages have been removed. Publish these changes before
using the new URLs.

The display says **Ready** when connected. Opening the scan URL sends
`UNLOCK_N` to `jelling-snake-hackathon-2026-N`, making that pair’s display glow
for 30 seconds. Repeated scans restart the timer. Loading a display does not
send a scan. Both devices need internet access.

The existing controller can send `GLOW_ON` / `GLOW_OFF` on the same channel,
or call `window.setGlowState(true/false)` on the display. Clicking the runestone
shows its station story. Press **G** to test glow and **Escape** to reset.

`js/channel.js`, `js/display.js`, `js/scan.js`, and `js/snake-animation.js` are required scripts in `js/`, with styles in `css/`.
