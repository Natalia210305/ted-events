import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CITIES = ['Αθήνα','Θεσσαλονίκη','Πάτρα','Ηράκλειο','Λάρισα','Βόλος','Ιωάννινα','Χανιά','Ρόδος','Καβάλα','Σέρρες','Αλεξανδρούπολη','Τρίκαλα','Καλαμάτα','Χαλκίδα','Λαμία','Κομοτηνή','Κέρκυρα','Μυτιλήνη','Κοζάνη','Αγρίνιο','Βέροια','Δράμα','Ξάνθη'];

const EVENT_TYPES = ['Συναυλία','Θεατρική Παράσταση','Σεμινάριο','Ημερίδα','Έκθεση','Αθλητική Εκδήλωση','Φεστιβάλ','Άλλο'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', eventType: '',
    venue: '', address: '', city: '', country: 'Greece',
    latitude: '', longitude: '',
    startDateTime: '', endDateTime: '',
    capacity: '', categories: '',
  });

  const [ticketTypes, setTicketTypes] = useState([
    { name: '', price: '', quantity: '' }
  ]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTicketChange = (i, field, value) => {
    const updated = [...ticketTypes];
    updated[i][field] = value;
    setTicketTypes(updated);
  };

  const addTicket = () => setTicketTypes([...ticketTypes, { name: '', price: '', quantity: '' }]);
  const removeTicket = (i) => setTicketTypes(ticketTypes.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const categories = form.categories.split(',').map(c => c.trim()).filter(Boolean);
      await api.post('/events', {
        ...form,
        capacity: parseInt(form.capacity),
        categories,
        ticketTypes: ticketTypes.map(t => ({
          name: t.name,
          price: parseFloat(t.price),
          quantity: parseInt(t.quantity),
        }))
      });
      navigate('/my-events');
    } catch (err) {
      setError(err.response?.data?.error || 'Σφάλμα κατά τη δημιουργία');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #e4dfda', fontFamily: 'Montserrat, sans-serif', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' };
  const labelStyle = { fontSize: '11px', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Montserrat, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '40px' }}>ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ</h1>

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>ΤΙΤΛΟΣ *</label>
            <input name="title" value={form.title} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ΤΥΠΟΣ ΕΚΔΗΛΩΣΗΣ *</label>
            <select name="eventType" value={form.eventType} onChange={handleChange} style={inputStyle}>
              <option value="">Επιλέξτε...</option>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>ΠΕΡΙΓΡΑΦΗ *</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>ΧΩΡΟΣ *</label>
            <input name="venue" value={form.venue} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ΔΙΕΥΘΥΝΣΗ *</label>
            <input name="address" value={form.address} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>ΠΟΛΗ *</label>
            <select name="city" value={form.city} onChange={handleChange} style={inputStyle}>
              <option value="">Επιλέξτε...</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>ΧΩΡΗΤΙΚΟΤΗΤΑ *</label>
            <input name="capacity" type="number" value={form.capacity} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>ΕΝΑΡΞΗ *</label>
            <input name="startDateTime" type="datetime-local" value={form.startDateTime} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ΛΗΞΗ *</label>
            <input name="endDateTime" type="datetime-local" value={form.endDateTime} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>ΓΕΩΓΡ. ΠΛΑΤΟΣ</label>
            <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} style={inputStyle} placeholder="π.χ. 37.9838" />
          </div>
          <div>
            <label style={labelStyle}>ΓΕΩΓΡ. ΜΗΚΟΣ</label>
            <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} style={inputStyle} placeholder="π.χ. 23.7275" />
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={labelStyle}>ΚΑΤΗΓΟΡΙΕΣ (χωρισμένες με κόμμα)</label>
          <input name="categories" value={form.categories} onChange={handleChange} style={inputStyle} placeholder="π.χ. Μουσική, Live Performance" />
        </div>

        {/* Ticket Types */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '1rem', letterSpacing: '2px', marginBottom: '16px' }}>ΤΥΠΟΙ ΕΙΣΙΤΗΡΙΩΝ</h2>
          {ticketTypes.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>ΟΝΟΜΑΣΙΑ</label>
                <input value={t.name} onChange={e => handleTicketChange(i, 'name', e.target.value)} style={inputStyle} placeholder="π.χ. General Admission" />
              </div>
              <div>
                <label style={labelStyle}>ΤΙΜΗ (€)</label>
                <input type="number" value={t.price} onChange={e => handleTicketChange(i, 'price', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ΠΟΣΟΤΗΤΑ</label>
                <input type="number" value={t.quantity} onChange={e => handleTicketChange(i, 'quantity', e.target.value)} style={inputStyle} />
              </div>
              <button onClick={() => removeTicket(i)} style={{ padding: '10px', backgroundColor: '#e53935', color: 'white', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button onClick={addTicket} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #d2b893', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '13px' }}>
            + ΠΡΟΣΘΗΚΗ ΤΥΠΟΥ ΕΙΣΙΤΗΡΙΟΥ
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '14px 32px', backgroundColor: '#d2b893', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '700', letterSpacing: '1px', fontSize: '14px' }}>
            {loading ? 'ΑΠΟΘΗΚΕΥΣΗ...' : 'ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ'}
          </button>
          <button onClick={() => navigate(-1)} style={{ padding: '14px 32px', backgroundColor: 'transparent', border: '1px solid #ccc', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}>
            ΑΚΥΡΟ
          </button>
        </div>
      </div>
    </div>
  );
}