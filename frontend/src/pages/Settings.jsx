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
  
  // Φορτώνουμε τις ειδοποιήσεις από το localStorage για να μην χάνονται στο Refresh
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('user_email_notif');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Φορτώνουμε τη γλώσσα από το localStorage
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('user_lang') || 'el';
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Κάθε φορά που αλλάζει η ειδοποίηση, αποθηκεύεται αυτόματα
  const handleToggleNotif = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('user_email_notif', JSON.stringify(newValue));
    
    // Feedback στον χρήστη
    setMessage({ text: 'Οι προτιμήσεις ειδοποιήσεων ενημερώθηκαν!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Κάθε φορά που αλλάζει η γλώσσα, αποθηκεύεται αυτόματα
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem('user_lang', newLang);
    
    setMessage({ text: 'Η γλώσσα της πλατφόρμας άλλαξε!', type: 'success' });
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

      setMessage({ text: response.data.message || 'Ο κωδικός πρόσβασης ενημερώθηκε επιτυχώς στη βάση!', type: 'success' });
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
    <div style={{ backgroundColor: COLORS.bgLight, minHeight: '100vh', padding: '40px 20px', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* ΤΙΤΛΟΣ ΣΕΛΙΔΑΣ */}
        <div style={{ marginBottom: '35px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: COLORS.dark, letterSpacing: '1px', margin: 0 }}>ΡΥΘΜΙΣΕΙΣ</h1>
          <div style={{ width: '50px', height: '4px', backgroundColor: COLORS.primary, marginTop: '8px' }} />
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '10px' }}>Διαχειριστείτε την ασφάλεια και τις προτιμήσεις του λογαριασμού σας μόνιμα.</p>
        </div>

        {/* ΜΗΝΥΜΑΤΑ FEEDBACK */}
        {message.text && (
          <div style={{ 
            backgroundColor: message.type === 'success' ? COLORS.successBg : COLORS.errorBg, 
            color: message.type === 'success' ? COLORS.success : COLORS.error, 
            padding: '14px 20px', 
            borderRadius: '12px', 
            fontWeight: '600', 
            fontSize: '14px', 
            marginBottom: '25px', 
            border: `1px solid ${message.type === 'success' ? '#d4e6c3' : '#f5c6cb'}` 
          }}>
            {message.type === 'success' ? '✨ ' : '❌ '} {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* 🔒 ΕΝΟΤΗΤΑ 1: ΑΣΦΑΛΕΙΑ & ΑΛΛΑΓΗ ΚΩΔΙΚΟΥ */}
          <div style={{ backgroundColor: COLORS.white, padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}` }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.dark, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔒</span> ΑΣΦΑΛΕΙΑ ΛΟΓΑΡΙΑΣΜΟΥ
            </h2>
            
            <form onSubmit={handleSubmitPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.dark, letterSpacing: '0.5px' }}>ΤΡΕΧΩΝ ΚΩΔΙΚΟΣ ΠΡΟΣΒΑΣΗΣ</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  required
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: COLORS.dark, letterSpacing: '0.5px' }}>ΝΕΟΣ ΚΩΔΙΚΟΣ</label>
                  <input 
                    type="password" 
                    name="newPassword"
                    required
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    style={inputStyle}
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
                    style={inputStyle}
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: COLORS.dark, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🔔</span> ΕΙΔΟΠΟΙΗΣΕΙΣ
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={toggleRowStyle} onClick={handleToggleNotif}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: COLORS.dark }}>Ειδοποιήσεις μέσω Email</div>
                  <div style={{ fontSize: '12px', color: COLORS.textMuted }}>Λαμβάνετε ενημερώσεις για αλλαγές στις κρατήσεις ή ακυρώσεις εκδηλώσεων.</div>
                </div>
                <input type="checkbox" checked={notifications} readOnly style={{ cursor: 'pointer', accentColor: COLORS.primary, width: '18px', height: '18px' }} />
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
  fontFamily: 'Montserrat, sans-serif'
};

const buttonStyle = {
  alignSelf: 'flex-start',
  padding: '12px 28px',
  borderRadius: '50px',
  border: 'none',
  backgroundColor: COLORS.primary,
  color: 'black',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(210, 184, 147, 0.2)',
  fontFamily: 'Montserrat, sans-serif',
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