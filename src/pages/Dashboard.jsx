import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFaces, deleteFace } from '../services/dbService';
import { UserPlus, ScanFace, Trash2, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const [faces, setFaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFaces();
  }, []);

  const loadFaces = async () => {
    const data = await getAllFaces();
    setFaces(data);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this face profile?")) {
      await deleteFace(id);
      loadFaces();
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2><Users style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Dashboard</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/history')}>
            <Clock size={18} /> Match History
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/enroll')}>
            <UserPlus size={18} /> Enroll Face
          </button>
          <button className="btn" onClick={() => navigate('/match')} disabled={faces.length === 0}>
            <ScanFace size={18} /> Live Matcher
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Enrolled Profiles ({faces.length})</h3>
        
        {faces.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0' }}>No faces enrolled yet. Add one to get started!</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {faces.map(face => (
              <div key={face.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {face.image ? (
                    <img 
                      src={face.image} 
                      alt={face.name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', background: '#000' }} 
                    />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={24} color="var(--text-secondary)" />
                    </div>
                  )}
                  <div>
                    <strong>{face.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Enrolled on {new Date(face.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px', color: '#ef4444', borderColor: 'transparent' }}
                  onClick={() => handleDelete(face.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
