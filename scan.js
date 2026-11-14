'use strict';
const statusText = document.getElementById('scan-status');
const retry = document.getElementById('retry');
async function sendScan() {
    retry.hidden = true;
    if (!window.vikingPairValid) {
        statusText.textContent = 'Unknown pair. Use scan.html?pair=1, 2 or 3.';
        return;
    }
    document.getElementById('scan-title').textContent = `Viking ${window.vikingPair}: NFC tag scanned`;
    statusText.textContent = 'Sending scan to the Viking display…';
    try {
        const response = await fetch(`https://ntfy.sh/${window.vikingChannel}`, {
            method: 'POST', body: `UNLOCK_${window.vikingPair}`
        });
        if (!response.ok) throw new Error('Scan could not be sent');
        statusText.textContent = `Scan sent. Look for the glow on Viking display ${window.vikingPair}.`;
    } catch {
        statusText.textContent = 'Could not send the scan. Check your connection and try again.';
        retry.hidden = false;
    }
}
retry.addEventListener('click', sendScan);
sendScan();
