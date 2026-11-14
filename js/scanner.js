import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// Change this to any unique secret channel name for your team!
const CHANNEL = "jelling-snake-hackathon-2026";
const video = document.getElementById("webcam");
const statusText = document.getElementById("status");
let detector;
let lastVideoTime = -1;
let isPersonClose = false;
let lastSentState = false;

async function startPhoneSensor() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
      delegate: "GPU"
    },
    scoreThreshold: 0.5,
    runningMode: "VIDEO",
    categoryAllowlist: ["person"]
  });

  // Use front camera ("user") or back camera ("environment")
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: 640, height: 480 }
  });
  video.srcObject = stream;
  video.addEventListener("loadeddata", detectLoop);
}

function detectLoop() {
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = detector.detectForVideo(video, performance.now());

    // Check if person fills at least 30% of the camera frame
    isPersonClose = results.detections.some(
      d => (d.boundingBox.width / video.videoWidth) >= 0.30
    );

    // Only send network message when state changes (prevents spam)
    if (isPersonClose !== lastSentState) {
      lastSentState = isPersonClose;
      const msg = isPersonClose ? "GLOW_ON" : "GLOW_OFF";
      statusText.innerText = isPersonClose ? "Visitor in proximity! (Glowing)" : "Waiting for visitor...";
      fetch(`https://ntfy.sh/${CHANNEL}`, { method: "POST", body: msg });
    }
  }
  requestAnimationFrame(detectLoop);
}

// OPTIONAL: If using Android Chrome, scan NFC directly on this page too
if ("NDEFReader" in window) {
  const ndef = new NDEFReader();
  document.body.addEventListener("click", async () => {
    await ndef.scan();
    ndef.onreading = (event) => {
      fetch(`https://ntfy.sh/${CHANNEL}`, { method: "POST", body: "UNLOCK_1" });
    };
  }, { once: true });
}

startPhoneSensor();
