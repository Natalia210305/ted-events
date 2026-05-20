import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CITIES = ['Αθήνα','Θεσσαλονίκη','Πάτρα','Ηράκλειο','Λάρισα','Βόλος','Ιωάννινα','Χανιά','Ρόδος','Καβάλα','Σέρρες','Αλεξανδρούπολη','Τρίκαλα','Καλαμάτα','Χαλκίδα','Λαμία','Κομοτηνή','Κέρκυρα','Μυτιλήνη','Κοζάνη','Αγρίνιο','Βέροια','Δράμα','Ξάνθη'];

const EVENT_TYPES = ['Συναυλία','Θεατρική Παράσταση','Σεμινάριο','Ημερίδα','Έκθεση','Αθλητική Εκδήλωση','Φεστιβάλ','Άλλο'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const editEvent = location.state?.editEvent;
  const isEditMode = !!editEvent;

  // 1. ΣΩΣΤΗ ΑΡΧΙΚΟΠΟΙΗΣΗ: Γεμίζουμε τη φόρμα ΑΝ έχουμε editEvent
  const [form, setForm] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || editEvent?.desc || '',
    eventType: editEvent?.eventType || '',
    venue: editEvent?.venue || '',
    address: editEvent?.address || '',
    city: editEvent?.city || '',
    country: editEvent?.country || 'Greece',
    latitude: editEvent?.geoLocation?.latitude ?? editEvent?.latitude ?? '',
    longitude: editEvent?.geoLocation?.longitude ?? editEvent?.longitude ?? '',
    startDateTime: editEvent?.startDateTime ? editEvent.startDateTime.substring(0, 16) : '',
    endDateTime: editEvent?.endDateTime ? editEvent.endDateTime.substring(0, 16) : '',
    capacity: editEvent?.capacity || '',
    categories: editEvent?.categories ? editEvent.categories.map(c => c.name || c).join(', ') : editEvent?.cats ? editEvent.cats.join(', ') : '',
  });

  // 2. ΣΩΣΤΗ ΑΡΧΙΚΟΠΟΙΗΣΗ ΕΙΣΙΤΗΡΙΩΝ
  const [ticketTypes, setTicketTypes] = useState(
    editEvent?.ticketTypes && editEvent.ticketTypes.length > 0
      ? editEvent.ticketTypes.map(t => ({ name: t.name, price: t.price.toString(), quantity: t.quantity.toString() }))
      : [{ name: '', price: '', quantity: '' }]
  );

  // 3. Συγχρονισμός σε περίπτωση που αλλάξει το state
  useEffect(() => {
    if (editEvent) {
      setForm({
        title: editEvent.title,
        description: editEvent.description || editEvent.desc || '',
        eventType: editEvent.eventType,
        venue: editEvent.venue,
        address: editEvent.address,
        city: editEvent.city,
        country: editEvent.country || 'Greece',
        latitude: editEvent.geoLocation?.latitude ?? editEvent.latitude ?? '',
        longitude: editEvent.geoLocation?.longitude ?? editEvent.longitude ?? '',
        startDateTime: editEvent.startDateTime ? editEvent.startDateTime.substring(0, 16) : '',
        endDateTime: editEvent.endDateTime ? editEvent.endDateTime.substring(0, 16) : '',
        capacity: editEvent.capacity,
        categories: editEvent.categories ? editEvent.categories.map(c => c.name || c).join(', ') : editEvent.cats ? editEvent.cats.join(', ') : '',
      });
      if (editEvent.ticketTypes && editEvent.ticketTypes.length > 0) {
        setTicketTypes(editEvent.ticketTypes.map(t => ({ name: t.name, price: t.price.toString(), quantity: t.quantity.toString() })));
      }
    }
  }, [editEvent]);

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
      // 1. Έλεγχος αν υπάρχουν εισιτήρια
      if (!ticketTypes || ticketTypes.length === 0 || !ticketTypes[0].name) {
        setError('Παρακαλώ προσθέστε τουλάχιστον έναν έγκυρο τύπο εισιτηρίου.');
        setLoading(false);
        return;
      }

      const categoriesArray = form.categories.split(',').map(c => c.trim()).filter(Boolean);
      
      // 2. ΕΝΩΝΟΥΜΕ ΤΑ ΣΤΟΙΧΕΙΑ ΤΗΣ ΦΟΡΜΑΣ ΜΑΖΙ ΜΕ ΤΑ ΕΙΣΙΤΗΡΙΑ
      const payload = {
        ...form,
        categories: categoriesArray,
        ticketTypes: ticketTypes // <--- ΑΥΤΟ ΗΤΑΝ ΤΟ ΚΛΕΙΔΙ ΠΟΥ ΕΛΕΙΠΕ!
      };

      console.log("🚀 Αποστολή Payload στο Backend:", payload);

      if (isEditMode) {
        const response = await api.put(`/events/${editEvent.id}`, payload);
        console.log("Απάντηση backend για το update:", response.data);
        alert('Η εκδήλωση ενημερώθηκε επιτυχώς!');
      } else {
        await api.post('/events', payload);
        alert('Η εκδήλωση δημιουργήθηκε επιτυχώς!');
      }
      
      navigate('/my-events');
    } catch (err) {
      console.error("Σφάλμα στο Frontend:", err);
      setError(err.response?.data?.error || 'Σφάλμα κατά την αποθήκευση');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px', border: '1px solid #e4dfda', fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' };
  const labelStyle = { fontSize: '11px', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Poppins, sans-serif', padding: '60px 20px', overflowY: 'auto' }}> 
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* ΔΥΝΑΜΙΚΟΣ ΤΙΤΛΟΣ */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '40px' }}>
          {isEditMode ? 'ΕΠΕΞΕΡΓΑΣΙΑ ΕΚΔΗΛΩΣΗΣ' : 'ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ'}
        </h1>

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
          <button onClick={addTicket} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #d2b893', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '13px' }}>
            + ΠΡΟΣΘΗΚΗ ΤΥΠΟΥ ΕΙΣΙΤΗΡΙΟΥ
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* ΔΥΝΑΜΙΚΟ ΚΕΙΜΕΝΟ ΚΟΥΜΠΙΟΥ */}
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '14px 32px', backgroundColor: '#d2b893', border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '700', letterSpacing: '1px', fontSize: '14px' }}>
            {loading ? 'ΑΠΟΘΗΚΕΥΣΗ...' : isEditMode ? 'ΑΠΟΘΗΚΕΥΣΗ ΑΛΛΑΓΩΝ' : 'ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ'}
          </button>
          <button onClick={() => navigate(-1)} style={{ padding: '14px 32px', backgroundColor: 'transparent', border: '1px solid #ccc', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '14px' }}>
            ΑΚΥΡΟ
          </button>
        </div>
      </div>
    </div>
  );
}