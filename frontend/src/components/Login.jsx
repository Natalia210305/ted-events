import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Έλεγχος: Κλείσε το modal μόνο αν υπάρχει η συνάρτηση onClose
      if (onClose) {
        onClose();
      }
      
      const role = res.data.user.role;  
      if (role === 'ADMIN') {
        navigate('/admin/users');        
      } else {
        navigate('/events');             
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Σφάλμα σύνδεσης');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 100
        }}
      />

      {/* Modal box */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(249, 247, 245, 0.97)',
        padding: '40px',
        zIndex: 101,
        minWidth: '340px',
        borderRadius: '1px',
        fontFamily: 'Poppins, sans-serif'
      }}>
        {/* Κουμπί κλεισίματος */}
        <button
          onClick={() => {
            if (onClose) {
              onClose(); // Αν άνοιξε σαν modal, κλείστο
            } else {
              navigate('/events'); // Αν είμαστε στο /login route, γύρνα τον χρήστη πίσω
            }
          }}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            background: 'none', border: 'none',
            fontSize: '1.2rem', cursor: 'pointer', color: '#888'
          }}
        >✕</button>

        <h2 style={{ textAlign: 'center', marginBottom: '24px', fontWeight: '700', color: '#2c2c2c', letterSpacing: '1px' }}>
          ΣΥΝΔΕΣΗ
        </h2>

        {error && <p style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', letterSpacing: '1px' }}>
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d2b893', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', letterSpacing: '1px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d2b893', outline: 'none', fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%', padding: '12px',
              backgroundColor: '#d2b893', color: 'black',
              border: 'none', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              letterSpacing: '2px', fontWeight: '600', fontSize: '14px'
            }}
          >
            ΣΥΝΔΕΣΗ
          </button>
        </form>
      </div>
    </>
  );
}