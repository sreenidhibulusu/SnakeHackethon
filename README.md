# Build a Viking

The builder has four pages:

1. `index.html` — choose man or woman.
2. `seasons.html` — choose spring, summer, autumn, or winter clothing.
3. `weapons.html` — choose spear, bow, sword, or axe.
4. `result.html` — see the finished Viking and type a name to display in runes.

Vikings begin unarmed in a patched, ragged tunic. Weapons and seasonal clothing
appear only after selection.

Click a choice to move to the next page. Back links preserve your choices.
Start again clears the character choices. Choices and the NFC pair travel in
URL parameters, so refreshing a page preserves the build.

`character.js` shares the illustration across the pages; `app.js` handles choices
and rune naming. Keep these files alongside the HTML pages when hosting.

## NFC scan

Open `index.html` on the display. Write the hosted `scan.html` URL to its NFC
tag. Opening that URL sends a signal that makes the display glow for 30 seconds.
Another scan restarts the timer. Character choices and naming stay available.

For example, if this workspace is hosted at `https://YOUR-HOST/`, use:

- Display: `https://YOUR-HOST/build-a-viking/index.html?pair=1`
- NFC tag: `https://YOUR-HOST/build-a-viking/scan.html?pair=1`

Include the actual hosted folder path. Pairs `1`, `2`, and `3` are supported;
omitting `pair` defaults to `1`. Use the same pair on both devices.

Both devices need internet access. The display says **ready** once connected.
Scans use the same ntfy.sh approach as SnakeHackethon, with separate channels
`build-a-viking-hackathon-2026-N`. Loading the builder never sends a scan.

Serve the folder using Live Server or a static website host. Publish these files
before writing the hosted scan URL onto a tag.
