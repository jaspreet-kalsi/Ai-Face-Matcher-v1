import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '../components/CameraView';
import PhotoScanner from '../components/PhotoScanner';
import { loadModels, getAllFaceEmbeddings, createFaceMatcher } from '../services/faceService';
import { getAllFaces } from '../services/dbService';
import { ArrowLeft, Scan, Camera, Image as ImageIcon } from 'lucide-react';

export default function LiveMatcher() {
  const [isReady, setIsReady] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [mode, setMode] = useState('camera');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      await loadModels();
      const faces = await getAllFaces();
      
      if (faces.length > 0) {
        const matcher = createFaceMatcher(faces);
        setFaceMatcher(matcher);
      }
      setIsReady(true);
    };
    init();
  }, []);

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button className="btn btn-secondary" style={{ marginBottom: '24px' }} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back
      </button>

      <h2><Scan style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Live Face Matcher</h2>
      <p style={{ marginBottom: '24px' }}>
        {faceMatcher 
          ? "Scanning camera feed to match against enrolled faces." 
          : "No faces enrolled. Please go back and enroll a face first."}
      </p>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
        <button className={`btn ${mode === 'camera' ? '' : 'btn-secondary'}`} onClick={() => setMode('camera')}>
          <Camera size={16} /> Live Camera
        </button>
        <button className={`btn ${mode === 'photo' ? '' : 'btn-secondary'}`} onClick={() => setMode('photo')}>
          <ImageIcon size={16} /> Upload Photo
        </button>
      </div>

      {!isReady ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading AI Models...</div>
      ) : (
        mode === 'camera' ? (
          <CameraView 
            drawBoxes={true} 
            onFaceDetected={getAllFaceEmbeddings} 
            faceMatcher={faceMatcher}
          />
        ) : (
          <PhotoScanner 
            drawBoxes={true} 
            onFaceDetected={getAllFaceEmbeddings} 
            faceMatcher={faceMatcher}
            buttonText="Select Photo to Scan"
          />
        )
      )}
    </div>
  );
}
