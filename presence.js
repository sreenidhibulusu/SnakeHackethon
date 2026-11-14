(() => {
  const button = document.getElementById("camera-toggle");
  const status = document.getElementById("camera-status");
  const video = document.getElementById("presence-camera");
  let stream;
  let detector;
  let timer;
  let lastSeen = -Infinity;
  let lastVideoTime = -1;

  function stopCamera(message = "Camera off") {
    clearTimeout(timer);
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
    detector?.close();
    detector = null;
    window.setGlowState?.(false);
    status.textContent = message;
    button.textContent = "Enable camera";
    button.disabled = false;
  }

  function detect() {
    if (!stream) return;
    try {
      const now = performance.now();
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = detector.detectForVideo(video, now);
        const personInFront = result.detections.some(({ boundingBox: box }) => {
          const center = (box.originX + box.width / 2) / video.videoWidth;
          return box.width / video.videoWidth >= 0.2 && center >= 0.2 && center <= 0.8;
        });
        if (personInFront) lastSeen = now;
      }
      // Brief missed detections should not make the display flicker.
      const present = now - lastSeen < 1500;
      status.textContent = present ? "Person in front of display" : "No person in front of display";
      window.setGlowState(present);
      timer = setTimeout(detect, 200);
    } catch {
      stopCamera("Detection failed. Try enabling the camera again.");
    }
  }

  button.addEventListener("click", async () => {
    if (stream) {
      stopCamera();
      return;
    }
    if (!window.setGlowState) {
      status.textContent = "Open location.html?pair=1, 2 or 3 first.";
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = "Camera requires HTTPS or localhost in a supported browser.";
      return;
    }
    button.disabled = true;
    status.textContent = "Allow camera access, then wait for the detector to load…";
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }, audio: false
      });
      video.srcObject = stream;
      await video.play();
      const { ObjectDetector, FilesetResolver } = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      detector = await ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite"
        },
        runningMode: "VIDEO", categoryAllowlist: ["person"], scoreThreshold: 0.5
      });
      lastSeen = -Infinity;
      lastVideoTime = -1;
      stream.getVideoTracks()[0].addEventListener("ended", () => stopCamera("Camera disconnected. Enable it to try again."));
      button.textContent = "Disable camera";
      button.disabled = false;
      detect();
    } catch (error) {
      const message = error.name === "NotAllowedError"
        ? "Camera permission denied. Allow it in browser settings and try again."
        : "Could not start detection. Check your camera and internet connection, then try again.";
      stopCamera(message);
    }
  });

  window.addEventListener("pagehide", () => stopCamera());
})();
