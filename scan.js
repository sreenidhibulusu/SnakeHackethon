'use strict';
const statusText = document.getElementById('scan-status');
const retry = document.getElementById('retry');
let sending = false;
let scanChannel;
try { scanChannel = new BroadcastChannel('build-a-viking-scans'); } catch { /* Remote scanning remains available. */ }

function sendToLocalDisplay(message) {
    if (!scanChannel) return Promise.resolve(false);
    return new Promise(resolve => {
        const requestId = `${Date.now()}-${Math.random()}`;
        const listener = event => {
            if (event.data?.type !== 'scan-ack' || event.data.requestId !== requestId) return;
            finish(true);
        };
        const timeout = setTimeout(() => finish(false), 600);
        function finish(received) {
            clearTimeout(timeout);
            scanChannel.removeEventListener('message', listener);
            resolve(received);
        }
        scanChannel.addEventListener('message', listener);
        scanChannel.postMessage({type:'scan', requestId, message});
    });
}

async function sendScan() {
    if (sending) return;
    retry.hidden = true;
    if (!window.vikingChannel) {
        statusText.textContent = 'Choose a station (start, seasons, weapons or result) and pair (1, 2 or 3) in the scan URL.';
        return;
    }
    if (!window.vikingTokenValid) {
        statusText.textContent = 'Add a tag ID to the URL, for example &token=viking-001 (letters, numbers, hyphens or underscores).';
        return;
    }
    sending = true;
    retry.disabled = true;
    document.getElementById('scan-title').textContent = 'NFC tag scanned';
    statusText.textContent = 'Sending scan to the matching station…';
    const message = {action:'OPEN_STATION', station:window.vikingStation, pair:window.vikingPair, token:window.vikingToken};
    let timeout;
    try {
        if (await sendToLocalDisplay(message)) {
            statusText.textContent = `Scan received by the ${window.vikingStation} display for token ${window.vikingToken}.`;
            return;
        }
        const controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`https://ntfy.sh/${window.vikingChannel}`, {
            method:'POST', body:JSON.stringify(message), signal:controller.signal
        });
        if (!response.ok) {
            const detail = (await response.text()).trim().slice(0, 180);
            throw new Error(`Scan service returned HTTP ${response.status}${detail ? ': ' + detail : ''}`);
        }
        statusText.textContent = `Scan sent. Use the ${window.vikingStation} display (pair ${window.vikingPair}).`;
    } catch (error) {
        statusText.textContent = error.name === 'AbortError'
            ? 'The remote scan service timed out. Try again, or test with the scan and matching display in tabs of the same browser.'
            : error.message.startsWith('Scan service returned') ? error.message
            : 'Could not reach the remote scan service. Check your internet connection, or test with the scan and display in tabs of the same browser.';
        retry.hidden = false;
    } finally {
        clearTimeout(timeout);
        sending = false;
        retry.disabled = false;
    }
}
retry.addEventListener('click', sendScan);
window.addEventListener('pagehide', () => scanChannel?.close());
sendScan();
