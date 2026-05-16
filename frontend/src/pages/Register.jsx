import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    username: '', password: '', firstName: '', lastName: '',
    email: '', phone: '', address: '', city: '', country: '', afm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setSuccess('Εγγραφή επιτυχής! Αναμένετε έγκριση.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Σφάλμα εγγραφής');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Εγγραφή</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        {['username', 'password', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country', 'afm'].map((field) => (
          <div key={field} style={{ marginBottom: '10px' }}>
            <label>{field}</label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              name={field}
              value={form[field]}
              onChange={handleChange}
              style={{ display: 'block', width: '100%', padding: '8px' }}
            />
          </div>
        ))}
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          Εγγραφή
        </button>
      </form>
    </div>
  );
}