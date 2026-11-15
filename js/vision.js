import { ObjectDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("webcam");
const PROXIMITY_THRESHOLD = 0.30; // Person fills at least 30% of frame width
const OFF_DEBOUNCE_MS = 1500;     // Prevent flicker when visitor reaches to tap NFC

let detector = null;
let lastVideoTime = -1;
let isPersonClose = false;
let glowOffTimer = null;

async function createDetector(vision) {
  const modelAssetPath =
    "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

  try {
    return await ObjectDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: "GPU" },
      scoreThreshold: 0.5,
      runningMode: "VIDEO",
      categoryAllowlist: ["person"]
    });
  } catch {
    return await ObjectDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: "CPU" },
      scoreThreshold: 0.5,
      runningMode: "VIDEO",
      categoryAllowlist: ["person"]
    });
  }
}

async function startVision() {
  if (!video || !navigator.mediaDevices?.getUserMedia) return;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    detector = await createDetector(vision);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 }
    });
    video.srcObject = stream;
    video.addEventListener("loadeddata", detectLoop, { once: true });
  } catch (err) {
    console.warn("Computer vision camera unavailable:", err);
  }
}

function detectLoop() {
  if (detector && video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = detector.detectForVideo(video, performance.now());

    const detectedNear = results.detections.some(
      (d) => video.videoWidth > 0 && (d.boundingBox.width / video.videoWidth) >= PROXIMITY_THRESHOLD
    );

    if (detectedNear) {
      clearTimeout(glowOffTimer);
      glowOffTimer = null;
      if (!isPersonClose || document.body.classList.contains("state-sleep")) {
        isPersonClose = true;
        window.setGlowState?.(true);
      }
    } else if (isPersonClose && !glowOffTimer) {
      glowOffTimer = setTimeout(() => {
        isPersonClose = false;
        glowOffTimer = null;
        window.setGlowState?.(false);
      }, OFF_DEBOUNCE_MS);
    }
  }

  requestAnimationFrame(detectLoop);
}

startVision();
