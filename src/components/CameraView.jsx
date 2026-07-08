import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { saveMatchHistory } from '../services/dbService';
import { extractFaceImage, distanceToPercentage } from '../services/faceService';

export default function CameraView({ 
  onVideoReady, 
  onFaceDetected, 
  faceMatcher = null,
  drawBoxes = true
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    let stream = null;
    let animationFrameId = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 720, height: 540 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasCamera(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (onVideoReady) onVideoReady(videoRef.current);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);

    const lastLogged = {}; // To prevent spamming history
    const COOLDOWN_MS = 5000;

    const detectLoop = async () => {
      if (video.paused || video.ended) return;

      if (onFaceDetected) {
        const detections = await onFaceDetected(video);
        
        if (drawBoxes && detections) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const resizedDetections = faceapi.resizeResults(
            Array.isArray(detections) ? detections : [detections], 
            displaySize
          );

          for (const det of resizedDetections) {
            const box = det.detection.box;
            // Draw box
            const drawBox = new faceapi.draw.DrawBox(box, { 
              boxColor: 'rgba(59, 130, 246, 0.8)',
              lineWidth: 2
            });
            drawBox.draw(canvas);

            // If we have a matcher and this detection has a descriptor
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

              // Log to history with cooldown
              const now = Date.now();
              if (name !== 'unknown' && (!lastLogged[name] || now - lastLogged[name] > COOLDOWN_MS)) {
                lastLogged[name] = now;
                extractFaceImage(video, det).then(imgData => {
                  if (imgData) {
                    saveMatchHistory(name, percentage, imgData);
                  }
                });
              }

            } else {
               const text = det.descriptor ? "Scanning..." : "Face Detected";
               const drawText = new faceapi.draw.DrawTextField(
                [text], 
                box.bottomLeft,
                { backgroundColor: 'rgba(0,0,0,0.5)', fontColor: '#fff', fontSize: 16, padding: 10 }
              );
              drawText.draw(canvas);
            }
          }
        } else if (drawBoxes) {
          // Clear if nothing detected
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      requestAnimationFrame(detectLoop);
    };

    detectLoop();
  };

  if (!hasCamera) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Camera Access Required</h3>
        <p>Please grant camera permissions to use this app.</p>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        className="camera-video"
      />
      <canvas ref={canvasRef} className="camera-canvas" />
    </div>
  );
}
