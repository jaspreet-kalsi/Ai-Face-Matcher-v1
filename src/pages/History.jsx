import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatchHistory, clearMatchHistory } from '../services/dbService';
import { ArrowLeft, Clock, Trash2, ShieldCheck, UserX } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getMatchHistory();
    setHistory(data);
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear all match history?")) {
      await clearMatchHistory();
      loadHistory();
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
        {history.length > 0 && (
          <button 
            className="btn btn-secondary" 
            style={{ color: '#ef4444', borderColor: 'transparent' }}
            onClick={handleClear}
          >
            <Trash2 size={18} /> Clear Log
          </button>
        )}
      </div>

      <h2 style={{ marginBottom: '24px' }}><Clock style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Match History</h2>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px' }}>
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No matches recorded yet. Go to Live Matcher to start scanning!</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {history.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px' }}>
                {item.snapshot ? (
                  <img 
                    src={item.snapshot} 
                    alt="Snapshot" 
                    style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', background: '#000' }} 
                  />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserX size={24} color="var(--text-secondary)" />
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{item.personName}</strong>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      background: item.matchPercentage > 80 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                      color: item.matchPercentage > 80 ? '#4ade80' : '#facc15',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ShieldCheck size={12} /> {item.matchPercentage}% Match
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
