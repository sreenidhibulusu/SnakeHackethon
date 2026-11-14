(() => {
  const CHANNEL = window.jellingChannel;
  const locationId = window.jellingPair;
  const status = document.getElementById("status");
  const retry = document.getElementById("retry");

  async function sendScan() {
    retry.hidden = true;
    if (!["1", "2", "3"].includes(locationId)) {
      status.textContent = "Unknown pair. Use scan.html?pair=1, 2 or 3.";
      return;
    }
    document.getElementById("title").textContent = `Location ${locationId} — NFC tag scanned`;
    status.textContent = "Sending scan to the location display…";
    try {
      const response = await fetch(`https://ntfy.sh/${CHANNEL}`, {
        method: "POST",
        body: `UNLOCK_${locationId}`
      });
      if (!response.ok) throw new Error("Scan could not be sent");
      status.textContent = `Scan sent. Look for the glow on the Location ${locationId} display.`;
    } catch {
      status.textContent = "Could not send the scan. Check your connection and try again.";
      retry.hidden = false;
    }
  }

  retry.addEventListener("click", sendScan);
  sendScan();
})();
