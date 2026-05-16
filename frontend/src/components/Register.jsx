import { useState } from 'react';
import api from '../services/api';

const fieldLabels = {
  username: 'USERNAME',
  password: 'PASSWORD',
  confirmPassword: 'ΕΠΙΒΕΒΑΙΩΣΗ PASSWORD',
  firstName: 'ΟΝΟΜΑ',
  lastName: 'ΕΠΩΝΥΜΟ',
  email: 'EMAIL',
  phone: 'ΤΗΛΕΦΩΝΟ',
  address: 'ΔΙΕΥΘΥΝΣΗ',
  city: 'ΠΟΛΗ',
  country: 'ΧΩΡΑ',
  afm: 'ΑΦΜ'
};

const inputStyle = {
  width: '100%', padding: '10px',
  border: '1px solid #d2b893', outline: 'none',
  fontFamily: 'Montserrat, sans-serif',
  boxSizing: 'border-box'
};

export default function RegisterModal({ onClose }) {
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', email: '',
    phone: '', address: '', city: '', country: '', afm: '', role: 'ATTENDEE'
  });
  const [usernameError, setUsernameError] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);  // ← για την "σελίδα" επιβεβαίωσης

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'username') setUsernameError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν');
      return;
    }

    try {
      const { confirmPassword, ...data } = form;
      console.log('Data που στέλνεται:', data);
      await api.post('/auth/register', data);
      setSubmitted(true);  // ← δείχνει μήνυμα αναμονής
    } catch (err) {
      const msg = err.response?.data?.error || 'Σφάλμα εγγραφής';
      if (msg.includes('username')) {
        setUsernameError('Το username χρησιμοποιείται ήδη. Παρακαλώ επιλέξτε άλλο.');
      } else {
        setError(msg);
      }
    }
  };

  const modalStyle = {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(249, 247, 245, 0.97)',
    padding: '40px',
    zIndex: 101,
    minWidth: '340px',
    maxHeight: '85vh',
    overflowY: 'auto',
    borderRadius: '1px',
    fontFamily: 'Montserrat, sans-serif'
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} />

      <div style={modalStyle}>
        <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✕</button>

        {/* Αν έχει υποβληθεί επιτυχώς → μήνυμα αναμονής */}
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>✓</div>
            <h2 style={{ fontWeight: '700', color: '#2c2c2c', letterSpacing: '1px', marginBottom: '16px' }}>
              ΕΓΓΡΑΦΗ ΕΠΙΤΥΧΗΣ
            </h2>
            <p style={{ color: '#555', lineHeight: '1.7', marginBottom: '24px' }}>
              Η αίτηση εγγραφής σας υποβλήθηκε επιτυχώς.<br />
              <strong>Εκκρεμεί η έγκρισή της από τον διαχειριστή.</strong><br />
              Θα ενημερωθείτε μόλις εγκριθεί ο λογαριασμός σας.
            </p>
            <button
              onClick={onClose}
              style={{ padding: '12px 40px', backgroundColor: '#d2b893', color: 'black', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', letterSpacing: '2px', fontWeight: '600' }}
            >
              ΚΛΕΙΣΙΜΟ
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '24px', fontWeight: '700', color: '#2c2c2c', letterSpacing: '1px', textAlign: 'center' }}>
              ΕΓΓΡΑΦΗ
            </h2>

            {error && <p style={{ color: 'red', marginBottom: '10px', fontSize: '0.9rem' }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              {Object.keys(fieldLabels).map((field) => (
                
                <div key={field} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', letterSpacing: '1px' }}>
                    {fieldLabels[field]}
                  </label>
                  <input
                    type={field === 'password' || field === 'confirmPassword' ? 'password' : 'text'}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    style={{
                      ...inputStyle,
                      border: field === 'username' && usernameError ? '1px solid red' : '1px solid #d2b893'
                    }}
                  />
                  {/* Inline error για username */}
                  {field === 'username' && usernameError && (
                    <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{usernameError}</p>
                  )}
                  {/* Inline error αν τα passwords δεν ταιριάζουν */}
                  {field === 'confirmPassword' && form.confirmPassword && form.password !== form.confirmPassword && (
                    <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>Οι κωδικοί δεν ταιριάζουν</p>
                  )}
                </div>
              ))}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', letterSpacing: '1px' }}>
                  ΡΟΛΟΣ
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  style={{
                    width: '100%', padding: '10px',
                    border: '1px solid #d2b893', outline: 'none',
                    fontFamily: 'Montserrat, sans-serif',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ATTENDEE">Συμμετέχων (κάνω κρατήσεις)</option>
                  <option value="ORGANIZER">Διοργανωτής (δημιουργώ εκδηλώσεις)</option>
                </select>
              </div>
              <button
                type="submit"
                style={{ width: '100%', padding: '12px', backgroundColor: '#d2b893', color: 'black', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', letterSpacing: '2px', fontWeight: '600', fontSize: '14px' }}
              >
                ΕΓΓΡΑΦΗ
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}