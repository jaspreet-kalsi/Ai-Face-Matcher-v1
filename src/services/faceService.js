import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

/**
 * Load all necessary face-api models
 */
export const loadModels = async () => {
  if (modelsLoaded) return;
  
  const MODEL_URL = '/models';
  
  try {
    console.log("Loading face-api models...");
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log("Models loaded successfully.");
  } catch (err) {
    console.error("Failed to load models:", err);
    throw err;
  }
};

/**
 * Extract a face embedding from an HTMLVideoElement or HTMLImageElement
 * Returns the first face found.
 */
export const getFaceEmbedding = async (videoOrImageElement) => {
  if (!modelsLoaded) throw new Error("Models not loaded");

  const detection = await faceapi.detectSingleFace(
    videoOrImageElement, 
    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
  ).withFaceLandmarks().withFaceDescriptor();

  if (!detection) return null;
  return detection;
};

/**
 * Extract multiple face embeddings from an HTMLVideoElement
 */
export const getAllFaceEmbeddings = async (videoOrImageElement) => {
  if (!modelsLoaded) throw new Error("Models not loaded");

  const detections = await faceapi.detectAllFaces(
    videoOrImageElement, 
    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
  ).withFaceLandmarks().withFaceDescriptors();

  return detections;
};

/**
 * Create a FaceMatcher instance from our database of enrolled faces
 * @param {Array} enrolledFaces - Array from dbService.getAllFaces()
 * @returns {faceapi.FaceMatcher}
 */
export const createFaceMatcher = (enrolledFaces) => {
  if (!enrolledFaces || enrolledFaces.length === 0) return null;

  const labeledDescriptors = enrolledFaces.map(face => {
    return new faceapi.LabeledFaceDescriptors(face.name, [face.embedding]);
  });

  // Threshold of 0.6 is default. Lower means stricter.
  return new faceapi.FaceMatcher(labeledDescriptors, 0.5);
};

/**
 * Extracts a cropped image of the face as a base64 Data URL
 */
export const extractFaceImage = async (videoOrImageElement, detection) => {
  try {
    const canvases = await faceapi.extractFaces(videoOrImageElement, [detection.detection]);
    if (canvases && canvases.length > 0) {
      return canvases[0].toDataURL('image/jpeg', 0.8);
    }
  } catch (err) {
    console.error("Failed to extract face image:", err);
  }
  return null;
};

/**
 * Converts Euclidean distance (0 to 1) to a human-readable percentage (0 to 100%)
 */
export const distanceToPercentage = (distance) => {
  return Math.max(0, (1 - distance) * 100).toFixed(1);
};
