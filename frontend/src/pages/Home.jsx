import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroImage from '../assets/hero3.png';
import LoginModal from '../components/Login';
import RegisterModal from '../components/Register';

export default function Home() {
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        
        <img
            src={heroImage}
            alt="TED Events"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(249, 247, 245, 0.9)',
            padding: '40px',
            textAlign: 'center',
            borderRadius: '1px',
            minWidth: '350px'
        }}>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1.8rem', fontWeight: '700', marginBottom: '30px', color: '#2c2c2c' }}>
            Οργάνωσε-Ανακάλυψε Εκδηλώσεις
            </h1>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '1rem', color: '#555', marginBottom: '25px', marginTop: '-20px', lineHeight: '1.6' }}>
            Η πλατφόρμα σου για να βρίσκεις μοναδικές εκδηλώσεις ή να δημιουργείς τις δικές σου, εύκολα και γρήγορα.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <button
                onClick={() => setShowLogin(true)}  
                style={{ padding: '12px 40px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#d2b893', color: 'black', border: 'none', borderRadius: '1px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '2px', fontWeight: '600' }}
            >
                ΣΥΝΔΕΣΗ
            </button>
            <button
                onClick={() => setShowRegister(true)}
                style={{ padding: '12px 40px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#d2b893', color: 'black', border: 'none', borderRadius: '1px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '2px', fontWeight: '600' }}
            >
                ΕΓΓΡΑΦΗ
            </button>
            <button
                onClick={() => {
                    localStorage.removeItem('token'); 
                    localStorage.removeItem('user');
                    navigate('/events'); 
                }}                
                style={{ padding: '12px 40px', fontSize: '14px', cursor: 'pointer', backgroundColor: 'transparent', color: 'black', border: '1px solid #d2b893', borderRadius: '1px', fontFamily: 'Montserrat, sans-serif', letterSpacing: '2px', fontWeight: '600' }}
            >
                ΠΕΡΙΗΓΗΣΗ
            </button>
            </div>
        </div>

        {/* Modal */}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
        </div>
    );
}