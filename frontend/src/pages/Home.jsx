import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero3.png';
import LoginModal from '../components/Login';
import RegisterModal from '../components/Register';

const COLORS = {
  primary: '#d2b893',      // Το premium μπεζ σου
  primaryHover: '#c5a982', // Σκούρο μπεζ για το hover
  dark: '#2c2c2c',         // Soft Ανθρακί
  white: '#ffffff',
  glassBg: 'rgba(243, 238, 231, 0.65)' // Soft warm glass background
};

export default function Home() {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Hover Animations για τα κουμπιά
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* Το background image σου */}
      <img
        src={heroImage}
        alt="TED Events"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Σκοτεινό overlay για βάθος */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        zIndex: 1
      }} />

      {/* ─── ΚΕΝΤΡΙΚΟ ΠΛΑΙΣΙΟ (EXTRA ΜΑΖΕΜΕΝΟ & COMPACT) ─── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        backgroundColor: COLORS.glassBg,
        backdropFilter: 'blur(20px)',      
        WebkitBackdropFilter: 'blur(20px)', 
        padding: '30px 25px',              // Πιο μαζεμένα εσωτερικά κενά
        textAlign: 'center',
        borderRadius: '35px',              
        width: '560px',                    // Μειώσαμε το πλάτος στα 560px (από 680px)
        maxWidth: '92%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.35)',
        zIndex: 2,
        boxSizing: 'border-box',
        animation: 'slideUp 0.8s ease-out forwards'
      }}>
        
        {/* Μικρό fancy διακοσμητικό έμβλημα */}
        <span style={{
          fontSize: '0.7rem',
          fontWeight: '800',
          letterSpacing: '2px',
          color: COLORS.dark,
          backgroundColor: 'rgba(210, 184, 147, 0.25)',
          padding: '5px 14px',
          borderRadius: '50px',
          display: 'inline-block',
          marginBottom: '15px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          ✨ WELCOME TO EVENTBYUS
        </span>

        <h1 style={{ 
          fontFamily: 'Poppins, sans-serif', 
          fontSize: '1.8rem',               // Ελαφρώς πιο μικρά γράμματα για να δένει με το νέο πλάτος
          fontWeight: '800', 
          marginBottom: '15px', 
          color: COLORS.dark,
          lineHeight: '1.25',
          letterSpacing: '-0.5px'
        }}>
          Οργάνωσε – Ανακάλυψε <br />
          <span style={{ 
            color: '#a0845b',
            borderBottom: '3px solid #d2b893',
            paddingBottom: '2px',
            display: 'inline-block'
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

        {/* ─── ΣΤΡΟΓΓΥΛΕΜΕΝΑ ΚΟΥΜΠΙΑ ─── */}
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

      {/* ─── CSS ANIMATION ΕΜΦΑΝΙΣΗΣ ─── */}
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
  padding: '10px 28px', // Ελαφρώς πιο μαζεμένα κουμπιά για να χωράνε τέλεια
  fontSize: '12.5px', 
  cursor: 'pointer', 
  border: 'none', 
  borderRadius: '50px', 
  fontFamily: 'Poppins, sans-serif', 
  letterSpacing: '1.2px', 
  fontWeight: '700',
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' 
};