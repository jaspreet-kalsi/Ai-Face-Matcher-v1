import React, { useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Upload } from 'lucide-react';
import { saveMatchHistory } from '../services/dbService';
import { extractFaceImage, distanceToPercentage } from '../services/faceService';

export default function PhotoScanner({ 
  onFaceDetected, 
  faceMatcher = null,
  drawBoxes = true,
  buttonText = "Upload Photo"
}) {
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  const handleImageLoad = async () => {
    if (!imageRef.current || !canvasRef.current || !onFaceDetected) return;
    
    setIsScanning(true);
    const img = imageRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match image natural dimensions
    const displaySize = { width: img.width, height: img.height };
    faceapi.matchDimensions(canvas, displaySize);

    try {
      const detections = await onFaceDetected(img);
      
      if (drawBoxes && detections) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const resizedDetections = faceapi.resizeResults(
          Array.isArray(detections) ? detections : [detections], 
          displaySize
        );

        const lastLogged = {};
        const COOLDOWN_MS = 5000;
        
        for (const det of resizedDetections) {
          const box = det.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { 
            boxColor: 'rgba(139, 92, 246, 0.8)', // purple for static
            lineWidth: 2
          });
          drawBox.draw(canvas);

          if (faceMatcher && det.descriptor) {
            const bestMatch = faceMatcher.findBestMatch(det.descriptor);
            const percentage = distanceToPercentage(bestMatch.distance);
            const name = bestMatch.label;
            const text = `${name} (${percentage}%)`;
            
            const drawText = new faceapi.draw.DrawTextField(
              [text], 
              box.bottomLeft,
              { backgroundColor: 'rgba(0,0,0,0.5)', fontColor: '#fff', fontSize: 16, padding: 10 }
            );
            drawText.draw(canvas);

            // Log to history
            const now = Date.now();
            if (name !== 'unknown' && (!lastLogged[name] || now - lastLogged[name] > COOLDOWN_MS)) {
              lastLogged[name] = now;
              extractFaceImage(img, det).then(imgData => {
                if (imgData) {
                  saveMatchHistory(name, percentage, imgData);
                }
              });
            }

          } else {
             const text = det.descriptor ? "Face Found" : "Detected";
             const drawText = new faceapi.draw.DrawTextField(
              [text], 
              box.bottomLeft,
              { backgroundColor: 'rgba(0,0,0,0.5)', fontColor: '#fff', fontSize: 16, padding: 10 }
            );
            drawText.draw(canvas);
          }
        }
      }
    } catch (err) {
      console.error("Error scanning photo:", err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <label className="btn btn-secondary" style={{ marginBottom: '16px', cursor: 'pointer' }}>
        <Upload size={18} /> {buttonText}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
      </label>

      {imageSrc && (
        <div className="camera-container" style={{ aspectRatio: 'auto', background: 'transparent' }}>
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Uploaded"
            onLoad={handleImageLoad}
            style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block' }}
          />
          <canvas 
            ref={canvasRef} 
            className="camera-canvas" 
            style={{ transform: 'none' }} /* override the mirror transform from camera css */
          />
          {isScanning && (
             <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '4px 12px', borderRadius: '20px', color: 'white', fontSize: '14px' }}>
               Scanning...
             </div>
          )}
        </div>
      )}
    </div>
  );
}
