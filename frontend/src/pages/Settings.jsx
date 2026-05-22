import React, { useState, useEffect } from 'react';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',      
  dark: '#2c2c2c',         
  textMuted: '#666666',    
  bgLight: '#fbf9f6',      
  border: '#e4dfda',       
  white: '#ffffff',
  success: '#27500A',
  successBg: '#EAF3DE',
  error: '#cb2d3e',
  errorBg: '#ffebee'
};

export default function Settings() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('user_email_notif');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('user_lang') || 'el';
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Αυτό το εφέ τρέχει ΜΟΝΟ μια φορά όταν "γεννιέται" η σελίδα των ρυθμίσεων
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggleNotif = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('user_email_notif', JSON.stringify(newValue));
    
    setMessage({ text: 'Οι προτιμήσεις ειδοποιήσεων ενημερώθηκαν!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Ο νέος κωδικός και η επιβεβαίωση δεν ταιριάζουν!', type: 'error' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ text: 'Ο νέος κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες!', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setMessage({ text: response.data.message || 'Ο κωδικός πρόσβασης ενημερώθηκε επιτυχώς!', type: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Λανθασμένος τρέχων κωδικός ή σφάλμα server.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: COLORS.bgLight, minHeight: '100vh', padding: '40px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: COLORS.dark, marginBottom: 0 }}>ΡΥΘΜΙΣΕΙΣ</h2>
          <div style={{ width: '80px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} />
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '25px' }}>Διαχειριστείτε την ασφάλεια και τις προτιμήσεις του λογαριασμού σας γρήγορα και εύκολα.</p> 
        </div>

        {message.text && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? COLORS.successBg : COLORS.errorBg, 
            color: message.type === 'success' ? COLORS.success : COLORS.error, 
            padding: '14px 20px', 
            borderRadius: '15px', 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '25px', 
            border: `1px solid ${message.type === 'success' ? '#d4e6c3' : '#f5c6cb'}`,
            textAlign: 'center', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <img 
              src={message.type === 'success' ? '/tick-mark.png' : '/cross.png'} 
              alt={message.type === 'success' ? 'Success' : 'Error'} 
              style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }}
            />
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* 🔒 ΕΝΟΤΗΤΑ 1: ΑΣΦΑΛΕΙΑ & ΑΛΛΑΓΗ ΚΩΔΙΚΟΥ */}
          <div style={{ backgroundColor: COLORS.white, padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}`, textAlign: 'center' }}>
            
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.dark, marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img 
                src="/verified.png"  
                alt="Security" 
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} 
              />
              ΑΣΦΑΛΕΙΑ ΛΟΓΑΡΙΑΣΜΟΥ
            </h2>
            
            <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.dark, letterSpacing: '0.5px' }}>ΤΡΕΧΩΝ ΚΩΔΙΚΟΣ ΠΡΟΣΒΑΣΗΣ</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  style={{ ...inputStyle, textAlign: 'center' }} 
                />
              </div>

              {/* ΔΙΟΡΘΩΜΕΝΗ ΓΡΑΜΜΗ GRID (Responsive Check) */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: (typeof window !== 'undefined' && window.innerWidth < 500) ? '1fr' : '1fr 1fr', 
                gap: '20px' 
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.dark, letterSpacing: '0.5px' }}>ΝΕΟΣ ΚΩΔΙΚΟΣ</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.dark, letterSpacing: '0.5px' }}>ΕΠΙΒΕΒΑΙΩΣΗ ΝΕΟΥ ΚΩΔΙΚΟΥ</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    required
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? 'ΓΙΝΕΤΑΙ ΕΝΗΜΕΡΩΣΗ...' : 'ΕΝΗΜΕΡΩΣΗ ΚΩΔΙΚΟΥ'}
              </button>
            </form>
          </div>

          {/* 🔔 ΕΝΟΤΗΤΑ 2: ΕΙΔΟΠΟΙΗΣΕΙΣ */}
          <div style={{ backgroundColor: COLORS.white, padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}` }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: COLORS.dark, marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <img 
                src="/notification.png"  
                alt="Notifications" 
                style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} 
              /> ΕΙΔΟΠΟΙΗΣΕΙΣ
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              <div style={toggleRowStyle} onClick={handleToggleNotif}>
                <div style={{ textAlign: 'left' }}> 
                  <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.dark }}>Ειδοποιήσεις</div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Λαμβάνετε ενημερώσεις για αλλαγές στις κρατήσεις ή ακυρώσεις εκδηλώσεων.</div>
                </div>
                <input type="checkbox" checked={notifications} readOnly style={{ cursor: 'pointer', accentColor: COLORS.primary, width: '18px', height: '18px', flexShrink: 0 }} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#fcfbfa',
  fontFamily: 'Poppins, sans-serif'
};

const buttonStyle = {
  alignSelf: 'center', 
  padding: '12px 35px',
  borderRadius: '50px',
  border: 'none',
  backgroundColor: COLORS.primary,
  color: 'black',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(210, 184, 147, 0.2)',
  fontFamily: 'Poppins, sans-serif',
  marginTop: '10px'
};

const toggleRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '8px 0',
  gap: '20px'
};

// Δικλίδα ασφαλείας για να μην χτυπάει ποτέ ξανά ReferenceError η React
const styles = {};