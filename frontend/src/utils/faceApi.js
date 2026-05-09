import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let modelsLoaded = false;

export async function loadFaceModels() {
  if (modelsLoaded) return;
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
  ]);
  
  modelsLoaded = true;
  console.log('Face-api models loaded successfully');
}

export async function detectFaces(videoEl) {
  const detections = await faceapi
    .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detections;
}

export async function detectSingleFace(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection;
}

export function drawDetections(canvasEl, videoEl, detections) {
  const displaySize = { width: videoEl.videoWidth, height: videoEl.videoHeight };
  faceapi.matchDimensions(canvasEl, displaySize);
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  const ctx = canvasEl.getContext('2d');
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  
  faceapi.draw.drawDetections(canvasEl, resizedDetections);
  faceapi.draw.drawFaceLandmarks(canvasEl, resizedDetections);
}

export { faceapi };
