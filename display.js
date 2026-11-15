(() => {
    const status = document.getElementById('scan-connection');
    const builder = document.querySelector('.builder');
    const done = document.getElementById('done');
    if (!window.vikingChannel) {
        status.textContent = 'Unknown display. Use pair=1, 2 or 3.';
        return;
    }
    let localChannel;
    try { localChannel = new BroadcastChannel('build-a-viking-scans'); } catch { /* Remote scans remain available. */ }
    const events = new EventSource(`https://ntfy.sh/${window.vikingChannel}/sse`);
    let active = false;
    let requestVersion = 0;
    done.addEventListener('click', async () => {
        const controls = [...builder.querySelectorAll('button, input')];
        controls.forEach(control => { control.disabled = true; });
        try {
            await window.vikingApp.finish();
            ++requestVersion;
            active = false;
            builder.hidden = true;
            document.body.classList.remove('scan-glow');
            status.textContent = events.readyState === EventSource.OPEN || localChannel
                ? 'Ready. Scan this station’s NFC tag to begin.'
                : 'Waiting for connection… Check your internet connection.';
            status.setAttribute('tabindex', '-1');
            status.focus();
        } catch (error) {
            status.textContent = error.message;
        } finally {
            controls.forEach(control => { control.disabled = false; });
        }
    });
    events.onopen = () => {
        status.textContent = active ? 'Choose your Viking’s details here.' : 'Ready. Scan this station’s NFC tag to begin.';
    };
    events.onerror = () => {
        status.textContent = localChannel
            ? 'Remote scans unavailable. Scans from tabs in this browser are ready.'
            : 'Disconnected. Reconnecting… Check your internet connection.';
    };
    async function handleScan(message) {
        if (!message || message.action !== 'OPEN_STATION' || message.station !== window.vikingStation || message.pair !== window.vikingPair || !window.vikingStore.validToken(message.token)) return false;
        const version = ++requestVersion;
        const sameToken = message.token === window.vikingApp.token;
        try {
            if (!sameToken) {
                active = false;
                builder.hidden = true;
                document.body.classList.remove('scan-glow');
                status.textContent = 'Loading your Viking…';
            }
            // Recheck saved choices; an unchanged Viking stays untouched.
            await window.vikingApp.selectToken(message.token);
            if (version !== requestVersion) return false;
            if (sameToken && active) return true;
            active = true;
            builder.hidden = false;
            window.vikingApp.beginVisit();
            document.body.classList.add('scan-glow');
            status.textContent = window.vikingStation === 'result'
                ? 'Your Viking so far.'
                : 'Make your choice, then select Show my Viking.';
            return true;
        } catch (error) {
            if (version === requestVersion) {
                // Keep the previous visitor's controls available to retry a failed save.
                if (window.vikingApp.token) {
                    active = true;
                    builder.hidden = false;
                    document.body.classList.add('scan-glow');
                }
                status.textContent = error.message;
            }
        }
    }
    events.onmessage = event => {
        try { return handleScan(JSON.parse(JSON.parse(event.data).message)); }
        catch { return; }
    };
    if (localChannel) localChannel.onmessage = async event => {
        if (event.data?.type !== 'scan' || typeof event.data.requestId !== 'string') return;
        if (await handleScan(event.data.message)) {
            localChannel.postMessage({type:'scan-ack', requestId:event.data.requestId});
        }
    };
    window.addEventListener('pagehide', () => {
        events.close();
        localChannel?.close();
    });
})();
