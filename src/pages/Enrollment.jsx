import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '../components/CameraView';
import PhotoScanner from '../components/PhotoScanner';
import { loadModels, getFaceEmbedding, extractFaceImage } from '../services/faceService';
import { saveFace } from '../services/dbService';
import { ArrowLeft, Save, Camera, Image as ImageIcon } from 'lucide-react';

export default function Enrollment() {
  const [name, setName] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'photo'
  const navigate = useNavigate();

  useEffect(() => {
    loadModels().then(() => setIsReady(true));
  }, []);

  const handleEnroll = async (videoElement) => {
    if (!name.trim()) {
      setError("Please enter a name first.");
      return;
    }
    
    setIsEnrolling(true);
    setError(null);
    
    try {
      const detection = await getFaceEmbedding(videoElement);
      if (!detection) {
        setError("No face detected! Please look at the camera.");
        setIsEnrolling(false);
        return;
      }
      
      const faceImage = await extractFaceImage(videoElement, detection);
      
      await saveFace(name, detection.descriptor, faceImage);
      alert("Successfully enrolled " + name + "!");
      navigate('/');
    } catch (err) {
      console.error(err);
      setError("Failed to enroll face.");
      setIsEnrolling(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button className="btn btn-secondary" style={{ marginBottom: '24px' }} onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back
      </button>

      <h2>Enroll New Face</h2>
      <p style={{ marginBottom: '24px' }}>Enter a name and look directly into the camera to enroll.</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Enter person's name..." 
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button 
          className="btn" 
          disabled={!isReady || isEnrolling || !name.trim()}
          onClick={() => {
            const mediaElement = mode === 'camera' ? document.querySelector('video') : document.querySelector('img[alt="Uploaded"]');
            if (mediaElement) handleEnroll(mediaElement);
            else setError(mode === 'camera' ? "Camera not ready." : "Please upload a photo first.");
          }}
        >
          <Save size={18} /> {isEnrolling ? 'Scanning...' : 'Save Face'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
        <button className={`btn ${mode === 'camera' ? '' : 'btn-secondary'}`} onClick={() => setMode('camera')}>
          <Camera size={16} /> Live Camera
        </button>
        <button className={`btn ${mode === 'photo' ? '' : 'btn-secondary'}`} onClick={() => setMode('photo')}>
          <ImageIcon size={16} /> Upload Photo
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

      {!isReady ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading AI Models...</div>
      ) : (
        mode === 'camera' ? (
          <CameraView drawBoxes={true} onFaceDetected={getFaceEmbedding} />
        ) : (
          <PhotoScanner drawBoxes={true} onFaceDetected={getFaceEmbedding} buttonText="Select Photo to Enroll" />
        )
      )}
    </div>
  );
}
