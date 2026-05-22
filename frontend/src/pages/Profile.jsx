import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',      
  dark: '#2c2c2c',         
  border: '#e4dfda',       
  white: '#ffffff',
  bgLight: '#f5f0eb'       
};

export default function Profile() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. ΕΜΠΛΟΥΤΙΣΜΕΝΟ STATE ΜΕ ΟΛΑ ΤΑ ΠΕΔΙΑ ΤΗΣ ΕΓΓΡΑΦΗΣ
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    afm: '',
    role: ''
  });

  useEffect(() => {
  const fetchUserProfile = async () => {
    try {
      // 1. Παίρνουμε το id του συνδεδεμένου χρήστη από το localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/');
        return;
      }
      const loggedInUser = JSON.parse(storedUser);

      // 2. Κάνουμε κλήση στο backend route που φέρνει τον χρήστη με βάση το ID του
      // Χρησιμοποιούμε το endpoint που έχεις ήδη έτοιμο: /api/users/:id
      const response = await api.get(`/users/${loggedInUser.id}`);
      
      const user = response.data;
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        afm: user.afm || '',
        role: user.role || ''
      });
    } catch (err) {
      console.error("Σφάλμα κατά την ανάκτηση των στοιχείων του προφίλ:", err);
      setError("Αποτυχία φόρτωσης των στοιχείων του προφίλ.");
    }
  };

  fetchUserProfile();
}, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Στέλνουμε ΟΛΑ τα νέα πεδία στο backend
      const response = await api.put('/users/profile', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        afm: formData.afm
      });

      // Ανανέωση του localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setSuccess('Το προφίλ σας ενημερώθηκε με επιτυχία!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Σφάλμα κατά την ενημέρωση του προφίλ.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px', border: `1px solid ${COLORS.border}`, fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white', borderRadius: '4px' };
  const labelStyle = { fontSize: '11px', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px', fontWeight: '600' };

  return (
    <div style={{ minHeight: 'calc(100vh - 90px)', backgroundColor: COLORS.bgLight, fontFamily: 'Poppins, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: COLORS.white, padding: '4px 70px 70px 70px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '2px', margin: '30px 0', color: COLORS.dark ,display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', }}>
          <img 
            src="/user.png" 
            alt="" 
            style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} 
          />ΤΟ ΠΡΟΦΙΛ ΜΟΥ
        </h1>

        {error && <p style={{ color: '#e53935', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}
        {success && <p style={{ color: '#4caf50', backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{success}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Όνομα / Επίθετο */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΟΝΟΜΑ</label>
              <input name="firstName" value={formData.firstName} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>ΕΠΙΘΕΤΟ</label>
              <input name="lastName" value={formData.lastName} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          {/* Email / Τηλέφωνο */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>ΤΗΛΕΦΩΝΟ</label>
              <input name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          {/* Διεύθυνση */}
          <div>
            <label style={labelStyle}>ΔΙΕΥΘΥΝΣΗ</label>
            <input name="address" value={formData.address} onChange={handleChange} style={inputStyle} />
          </div>

          {/* Πόλη / Χώρα */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΠΟΛΗ</label>
              <input name="city" value={formData.city} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ΧΩΡΑ</label>
              <input name="country" value={formData.country} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          {/* ΑΦΜ / Ρόλος */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΑΦΜ</label>
              <input name="afm" value={formData.afm} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ΡΟΛΟΣ ΛΟΓΑΡΙΑΣΜΟΥ</label>
              <input value={formData.role} style={{ ...inputStyle, backgroundColor: '#f0f0f0', cursor: 'not-allowed', color: '#666' }} disabled />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '14px', backgroundColor: COLORS.primary, color: COLORS.dark, border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '700', letterSpacing: '1px', fontSize: '13.5px', borderRadius: '60px', transition: '0.2s' }}>
              {loading ? 'ΑΠΟΘΗΚΕΥΣΗ...' : 'ΑΠΟΘΗΚΕΥΣΗ ΑΛΛΑΓΩΝ'}
            </button>
            <button type="button" onClick={() => navigate(-1)} style={{ padding: '14px 25px', backgroundColor: 'transparent', border: `1px solid ${COLORS.border}`, cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '13.5px', borderRadius: '60px' }}>
              ΑΚΥΡΟ
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}