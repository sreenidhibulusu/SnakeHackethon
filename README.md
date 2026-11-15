# Build a Viking museum stations

The starting station renders the full saved Viking, including its weapon and
clothing. Its controls are limited to naming, man/woman, and Reset Viking.
Equipment can only be changed at the weapon and clothing stations.

Each station stays on its own page. A matching phone scan reveals the Viking.
The starting, clothing, and weapon stations open on a question view.
Show my Viking saves the current answer and opens the accumulated character.
Pick again returns to the question with the saved selections intact. The result
station opens directly on the accumulated Viking. Repeated scans during a visit
preserve the current view; new visitors and visits begin at the question. Done hides the builder and
returns to waiting, keeping that token's saved choices.

Use a unique `token` ID for each child's tag. Letters, numbers, hyphens and
underscores are supported, up to 80 characters. An example is `viking-001`.

| Station | Display URL | Phone scan URL |
| --- | --- | --- |
| Starting / rune name | `index.html?pair=1` | `scan.html?station=start&pair=1&token=viking-001` |
| Clothing | `seasons.html?pair=1` | `scan.html?station=seasons&pair=1&token=viking-001` |
| Weapons | `weapons.html?pair=1` | `scan.html?station=weapons&pair=1&token=viking-001` |
| Result | `result.html?pair=1` | `scan.html?station=result&pair=1&token=viking-001` |

Prefix these paths with the hosted folder URL. For example:
`https://YOUR-HOST/build-a-viking/scan.html?station=weapons&pair=1&token=viking-001`.
For the phone simulation, use the same token ID at each station and change the
`station` parameter to match the display. A real token reader would supply the
token ID while the station supplies its own station and pair.

Pairs 1, 2 and 3 support multiple displays of each station type. Scans must match
both station and pair. Old scan URLs must include `station` and `token`.

## Saved Vikings

Profiles are stored in localStorage under `build-a-viking:token:TOKEN_ID`.

- Scanning the current ID checks its saved choices and updates a stale preview
  without navigating or resetting. Unchanged choices leave the form untouched.
- Scanning another ID loads that token's saved profile and updates `token` in the display URL.
- A new ID starts unarmed in ragged clothing.
- Names, character choices, weapons and outfits are saved automatically.
- Reset Viking is available only at the starting station. It resets the current
  token to its default character, empty name, ragged clothing and no weapon.
  The token ID and other tokens are kept. Scanning alone never resets a Viking.
- Done waits for saves before returning to the waiting state.
- Profiles persist across reloads and browser restarts until browser data is cleared.
- Station tabs on the same website and browser share profiles; active tabs update when another station changes the same token. Returning to
  a tab also refreshes its saved Viking. Visible tabs recheck the current token
  every second so names and equipment stay current even if storage events are missed.

Serve all station pages from the same origin (scheme, host and port), using Live
Server or a static host. localStorage belongs to the display browser. It does not
sync between different computers, browsers, private browsing sessions, or the
phone and display. Use tabs in the same browser to demo the full museum journey.
The phone only sends the token scan; character choices live on the display.

## Connection

Open the display first, wait for Ready, then open its scan URL on the phone.
Scans in another tab of the same browser use a direct BroadcastChannel message
and wait for acknowledgement from a matching display. This local test path does
not need ntfy.sh. Open display tabs first, then the matching scan links using the
same website address. A scan for a different station or pair cannot unlock them.

Phone scans fall back to the remote notification service and need internet.
Remote failures show the HTTP error or time out after 10 seconds, with a retry
button. Local testing still works if the remote service is unavailable.
Messages use station-specific ntfy.sh channels
`build-a-viking-hackathon-2026-STATION-PAIR`. Reloading a display waits for a new
scan. No backend or database is required for this localStorage prototype.

## Checks

Run `node tests/token-flow.cjs` from this folder to check token switching,
profile persistence, station filtering, Done, and shared station tabs.

A full browser regression is also available:

```sh
VIKING_CHROMIUM=/path/to/chrome-headless-shell node tests/browser-flow.cjs
```

It uses the installed browser with a temporary profile. Website requests are
served directly from these files, and external requests are intercepted. It
checks real page startup, direct scan acknowledgements, name synchronization,
equipment, Done, token switching, Reset, and remote error messages without
sending real notifications.
