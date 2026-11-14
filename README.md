# SnakeHackethon

Serve this folder on your website. Keep each laptop connected to the internet
with its own page open:

| Location | Laptop page | URL to write to its NFC tag |
| --- | --- | --- |
| 1 | `location1.html` | `https://YOUR-HOST/scan.html?location=1` |
| 2 | `location2.html` | `https://YOUR-HOST/scan.html?location=2` |
| 3 | `location3.html` | `https://YOUR-HOST/scan.html?location=3` |

Include the folder path in the tag URLs if the site is hosted in a subfolder.
Opening the URL on a phone sends the scan through the existing ntfy channel.
Only the matching laptop glows; it stays on its location page and returns to
sleep after 30 seconds. A new scan restarts that timer. Loading a laptop page
does not publish a scan. Tags pointing directly to `locationN.html` must be
rewritten to the scan URLs above.

For a local demonstration, press **G** on a laptop to glow, **Escape** to sleep,
or click the runestone / press **Space** to read its story.