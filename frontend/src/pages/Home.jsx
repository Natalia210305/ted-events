import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero3.png';
import LoginModal from '../components/Login';
import RegisterModal from '../components/Register';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',     
  primaryHover: '#c5a982', 
  dark: '#2c2c2c',        
  brown: '#815a3a',         
  white: '#ffffff',
  glassBg: 'rgba(243, 238, 231, 0.65)' 
};

export default function Home() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleMouseOver = (e, type) => {
    e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
    if (type === 'primary') {
      e.currentTarget.style.backgroundColor = COLORS.primaryHover;
      e.currentTarget.style.boxShadow = '0 12px 25px rgba(210, 184, 147, 0.4)';
    } else if (type === 'outline') {
      e.currentTarget.style.backgroundColor = COLORS.dark;
      e.currentTarget.style.color = COLORS.white;
      e.currentTarget.style.boxShadow = '0 12px 25px rgba(0, 0, 0, 0.15)';
      e.currentTarget.style.borderColor = COLORS.dark;
    }
  };

  const handleMouseOut = (e, type) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    if (type === 'primary') {
      e.currentTarget.style.backgroundColor = COLORS.primary;
      e.currentTarget.style.boxShadow = 'none';
    } else if (type === 'outline') {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'black';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = COLORS.primary;
    }
  };

  useEffect(() => {
    if (user) {
      api.get(`/events/recommendations?userId=${user.id || user.user_id}`)
        .then(res => {
          setRecommendations(res.data);
          setLoadingRecs(false);
        })
        .catch(err => {
          console.error("Error loading recommendations:", err);
          setLoadingRecs(false);
        });
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <img
        src={heroImage}
        alt="TED Events"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        zIndex: 1
      }} />

      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        backgroundColor: COLORS.glassBg,
        backdropFilter: 'blur(20px)',      
        WebkitBackdropFilter: 'blur(20px)', 
        padding: '30px 25px',             
        textAlign: 'center',
        borderRadius: '35px',              
        width: '560px',                   
        maxWidth: '92%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        zIndex: 2,
        boxSizing: 'border-box',
        animation: 'slideUp 0.8s ease-out forwards'
      }}>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <span style={{
            height: '1px',
            width: '20px',
            backgroundColor: COLORS.dark,
            opacity: 0.5
          }} />
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            letterSpacing: '3px',
            color: COLORS.dark,
            fontFamily: 'Poppins, sans-serif',
            textTransform: 'uppercase'
          }}>
            Welcome to EventByUs
          </span>
          <span style={{
            height: '1px',
            width: '20px',
            backgroundColor: COLORS.dark,
            opacity: 0.5
          }} />
        </div>

        <h1 style={{ 
          fontFamily: 'Poppins, sans-serif', 
          fontSize: '1.65rem',              
          fontWeight: '800', 
          marginBottom: '15px', 
          color: '#000000',
          lineHeight: '1.25',
          letterSpacing: '-0.5px'
        }}>
          Οργάνωσε – Ανακάλυψε <br />
          <span style={{ 
            color: '#000000',                    
            display: 'inline-block',
            borderBottom: `3px solid ${COLORS.primary}`, 
            paddingBottom: '3px',                
            
            fontWeight: '900',                   
            letterSpacing: '0.5px'                
          }}>
            Εκδηλώσεις
          </span>
      </h1>
        
        <p style={{ 
          fontFamily: 'Poppins, sans-serif', 
          fontSize: '0.88rem', 
          color: '#333', 
          marginBottom: '25px', 
          lineHeight: '1.55',
          fontWeight: '500'
        }}>
          Η πλατφόρμα σου για να βρίσκεις μοναδικές εκδηλώσεις ή να δημιουργείς τις δικές σου, εύκολα και γρήγορα.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          
          <button
            onClick={() => setShowLogin(true)}  
            onMouseOver={(e) => handleMouseOver(e, 'primary')}
            onMouseOut={(e) => handleMouseOut(e, 'primary')}
            style={{ ...buttonStyle, backgroundColor: COLORS.primary, color: 'black' }}
          >
            ΣΥΝΔΕΣΗ
          </button>

          <button
            onClick={() => setShowRegister(true)}
            onMouseOver={(e) => handleMouseOver(e, 'primary')}
            onMouseOut={(e) => handleMouseOut(e, 'primary')}
            style={{ ...buttonStyle, backgroundColor: COLORS.primary, color: 'black' }}
          >
            ΕΓΓΡΑΦΗ
          </button>

          <button
            onClick={() => {
              localStorage.removeItem('token'); 
              localStorage.removeItem('user');
              navigate('/events'); 
            }}                
            onMouseOver={(e) => handleMouseOver(e, 'outline')}
            onMouseOut={(e) => handleMouseOut(e, 'outline')}
            style={{ 
              ...buttonStyle, 
              backgroundColor: 'transparent', 
              color: 'black', 
              border: `2px solid ${COLORS.primary}` 
            }}
          >
            ΠΕΡΙΗΓΗΣΗ
          </button>

        </div>
      </div>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>

    </div>
  );
}

const buttonStyle = {
  padding: '10px 28px', 
  fontSize: '12.5px', 
  cursor: 'pointer', 
  border: 'none', 
  borderRadius: '50px', 
  fontFamily: 'Poppins, sans-serif', 
  letterSpacing: '1.2px', 
  fontWeight: '700',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
};