(() => {
    const status = document.getElementById('scan-connection');
    if (!window.vikingPairValid) {
        status.textContent = 'Unknown pair. Use index.html?pair=1, 2 or 3.';
        return;
    }
    let resetTimer;
    const events = new EventSource(`https://ntfy.sh/${window.vikingChannel}/sse`);
    events.onopen = () => {
        status.textContent = `Viking ${window.vikingPair} ready. Scan the NFC tag.`;
    };
    events.onerror = () => {
        status.textContent = 'Disconnected. Reconnecting… Check your internet connection.';
    };
    events.onmessage = event => {
        try {
            if (JSON.parse(event.data)?.message?.trim() !== `UNLOCK_${window.vikingPair}`) return;
            clearTimeout(resetTimer);
            document.body.classList.add('scan-glow');
            status.textContent = 'NFC scanned! Build your Viking.';
            resetTimer = setTimeout(() => {
                document.body.classList.remove('scan-glow');
                status.textContent = `Viking ${window.vikingPair} ready. Scan the NFC tag.`;
            }, 30000);
        } catch {
            // Ignore malformed events.
        }
    };
    window.addEventListener('pagehide', () => {
        clearTimeout(resetTimer);
        events.close();
    });
})();
