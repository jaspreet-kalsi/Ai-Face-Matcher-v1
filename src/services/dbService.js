import localforage from 'localforage';

// Initialize the local store
const store = localforage.createInstance({
  name: 'AIFaceMatcher',
  storeName: 'face_embeddings'
});

// Initialize the history store
const historyStore = localforage.createInstance({
  name: 'AIFaceMatcher',
  storeName: 'match_history'
});

/**
 * Save a new face embedding to IndexedDB
 * @param {string} id - Unique identifier (e.g. timestamp or UUID)
 * @param {string} name - Name of the person
 * @param {Float32Array} embedding - 128-dimensional face descriptor
 * @param {string} image - Base64 Data URL of the cropped face
 */
export const saveFace = async (name, embedding, image = null) => {
  try {
    const id = Date.now().toString();
    // Convert Float32Array to standard array for serialization
    const embeddingArray = Array.from(embedding);
    
    await store.setItem(id, {
      id,
      name,
      embedding: embeddingArray,
      image,
      createdAt: Date.now()
    });
    return id;
  } catch (error) {
    console.error("Error saving face to DB:", error);
    throw error;
  }
};

/**
 * Retrieve all enrolled faces
 * @returns {Promise<Array>} Array of face objects {id, name, embedding: Float32Array}
 */
export const getAllFaces = async () => {
  try {
    const faces = [];
    await store.iterate((value) => {
      faces.push({
        ...value,
        // Convert back to Float32Array for face-api.js comparison
        embedding: new Float32Array(value.embedding)
      });
    });
    return faces;
  } catch (error) {
    console.error("Error retrieving faces from DB:", error);
    return [];
  }
};

/**
 * Delete a face by ID
 */
export const deleteFace = async (id) => {
  try {
    await store.removeItem(id);
  } catch (error) {
    console.error("Error deleting face from DB:", error);
    throw error;
  }
};

/**
 * Save a match to history
 * @param {string} personName 
 * @param {number} matchPercentage 
 * @param {string} snapshot Base64 Data URL
 */
export const saveMatchHistory = async (personName, matchPercentage, snapshot) => {
  try {
    const id = Date.now().toString();
    await historyStore.setItem(id, {
      id,
      personName,
      matchPercentage,
      snapshot,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error saving to match history:", error);
  }
};

/**
 * Get all match history sorted by newest first
 */
export const getMatchHistory = async () => {
  try {
    const history = [];
    await historyStore.iterate((value) => {
      history.push(value);
    });
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error retrieving match history:", error);
    return [];
  }
};

/**
 * Clear all match history
 */
export const clearMatchHistory = async () => {
  try {
    await historyStore.clear();
  } catch (error) {
    console.error("Error clearing match history:", error);
  }
};
