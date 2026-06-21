import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',      
  dark: '#2c2c2c',         
  border: '#e4dfda',       
  white: '#ffffff',
  bgLight: '#f5f0eb'       
};

const CITIES = ['Αθήνα','Θεσσαλονίκη','Πάτρα','Ηράκλειο','Λάρισα','Βόλος','Ιωάννινα','Χανιά','Ρόδος','Καβάλα','Σέρρες','Αλεξανδρούπολη','Τρίκαλα','Καλαμάτα','Χαλκίδα','Λαμία','Κομοτηνή','Κέρκυρα','Μυτιλήνη','Κοζάνη','Αγρίνιο','Βέροια','Δράμα','Ξάνθη'];

const EVENT_TYPES = ['Συναυλία','Θεατρική Παράσταση','Σεμινάριο','Ημερίδα','Έκθεση','Αθλητική Εκδήλωση','Φεστιβάλ','Άλλο'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const editEvent = location.state?.editEvent;
  const isEditMode = !!editEvent;

  // 1. ΑΡΧΙΚΟΠΟΙΗΣΗ (ΔΙΟΡΘΩΜΕΝΗ: Διαβάζει πρώτα τα χύμα latitude/longitude)
  const [form, setForm] = useState({
    title: editEvent?.title || '',
    description: editEvent?.description || editEvent?.desc || '',
    eventType: editEvent?.eventType || '',
    venue: editEvent?.venue || '',
    address: editEvent?.address || '',
    city: editEvent?.city || '',
    country: editEvent?.country || 'Greece',
    latitude: editEvent?.latitude ?? editEvent?.geoLocation?.latitude ?? '',
    longitude: editEvent?.longitude ?? editEvent?.geoLocation?.longitude ?? '',
    startDateTime: editEvent?.startDateTime ? editEvent.startDateTime.substring(0, 16) : '',
    endDateTime: editEvent?.endDateTime ? editEvent.endDateTime.substring(0, 16) : '',
    capacity: editEvent?.capacity || '',
    categories: editEvent?.categories ? editEvent.categories.map(c => c.name || c).join(', ') : editEvent?.cats ? editEvent.cats.join(', ') : '',
  });

  const [ticketTypes, setTicketTypes] = useState(
    editEvent?.ticketTypes && editEvent.ticketTypes.length > 0
      ? editEvent.ticketTypes.map(t => ({ 
          id: t.id || t.ticketTypeID || null, 
          name: t.name, 
          price: t.price.toString(), 
          quantity: t.quantity.toString() 
        }))
      : [{ name: '', price: '', quantity: '' }]
  );

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
        latitude: editEvent.latitude ?? editEvent.geoLocation?.latitude ?? '',
        longitude: editEvent.longitude ?? editEvent.geoLocation?.longitude ?? '',
        startDateTime: editEvent.startDateTime ? editEvent.startDateTime.substring(0, 16) : '',
        endDateTime: editEvent.endDateTime ? editEvent.endDateTime.substring(0, 16) : '',
        capacity: editEvent.capacity,
        categories: editEvent.categories ? editEvent.categories.map(c => c.name || c).join(', ') : editEvent.cats ? editEvent.cats.join(', ') : '',
      });
      if (editEvent.ticketTypes && editEvent.ticketTypes.length > 0) {
        setTicketTypes(editEvent.ticketTypes.map(t => ({ 
          id: t.id || t.ticketTypeID || null, 
          name: t.name, 
          price: t.price.toString(), 
          quantity: t.quantity.toString() 
        })));
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

  const addTicket = () => setTicketTypes([...ticketTypes, { id: null, name: '', price: '', quantity: '' }]);
  const removeTicket = (i) => setTicketTypes(ticketTypes.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); 
    setError('');
    setLoading(true);
    try {
      if (!ticketTypes || ticketTypes.length === 0 || !ticketTypes[0].name) {
        setError('Παρακαλώ προσθέστε τουλάχιστον έναν έγκυρο τύπο εισιτηρίου.');
        setLoading(false);
        return;
      }

      const fixDateTime = (dtStr) => {
        if (!dtStr) return '';
        return dtStr.length === 16 ? `${dtStr}:00` : dtStr;
      };

      const categoriesArray = form.categories.split(',').map(c => c.trim()).filter(Boolean);
      
      const payload = {
        title: form.title,
        description: form.description,
        eventType: form.eventType,
        venue: form.venue,
        address: form.address,
        city: form.city,
        country: form.country,
        capacity: parseInt(form.capacity, 10), 
        startDateTime: fixDateTime(form.startDateTime), 
        endDateTime: fixDateTime(form.endDateTime),     
        categories: categoriesArray,
        
        latitude: form.latitude && form.latitude !== '' ? parseFloat(form.latitude) : null,
        longitude: form.longitude && form.longitude !== '' ? parseFloat(form.longitude) : null,
        
        ticketTypes: ticketTypes.map(t => ({
          id: t.id || null,
          name: t.name,
          price: parseFloat(t.price || 0),
          quantity: parseInt(t.quantity || 0, 10)
        }))
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
      setError(err.response?.data?.message || err.response?.data?.error || 'Σφάλμα κατά την αποθήκευση (Internal Server Error 500)');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px', border: `1px solid ${COLORS.border}`, fontFamily: 'Poppins, sans-serif', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white', borderRadius: '4px' };
  const labelStyle = { fontSize: '11px', letterSpacing: '1px', color: '#888', display: 'block', marginBottom: '6px', fontWeight: '600' };

  return (
    <div style={{ minHeight: 'calc(100vh - 90px)', backgroundColor: COLORS.bgLight, fontFamily: 'Poppins, sans-serif', padding: '40px 20px' }}> 
      <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: COLORS.white, padding: '4px 70px 70px 70px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        <h1 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '2px', margin: '30px 0', color: COLORS.dark, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          {isEditMode ? 'ΕΠΕΞΕΡΓΑΣΙΑ ΕΚΔΗΛΩΣΗΣ' : 'ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ'}
        </h1>

        {error && <p style={{ color: '#e53935', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px', fontSize: '14px', marginBottom: '20px' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΤΙΤΛΟΣ *</label>
              <input name="title" value={form.title} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>ΤΥΠΟΣ ΕΚΔΗΛΩΣΗΣ *</label>
              <select name="eventType" value={form.eventType} onChange={handleChange} style={inputStyle} required>
                <option value="">Επιλέξτε...</option>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>ΠΕΡΙΓΡΑΦΗ *</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical' }} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΧΩΡΟΣ *</label>
              <input name="venue" value={form.venue} onChange={handleChange} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>ΔΙΕΥΘΥΝΣΗ *</label>
              <input name="address" value={form.address} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΠΟΛΗ *</label>
              <select name="city" value={form.city} onChange={handleChange} style={inputStyle} required>
                <option value="">Επιλέξτε...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ΧΩΡΗΤΙΚΟΤΗΤΑ *</label>
              <input name="capacity" type="number" value={form.capacity} onChange={handleChange} style={inputStyle} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΕΝΑΡΞΗ *</label>
              <input 
                name="startDateTime" 
                type={form.startDateTime ? "datetime-local" : "text"} 
                placeholder="Επιλέξτε ημερομηνία & ώρα" 
                value={form.startDateTime} 
                onChange={handleChange} 
                onFocus={(e) => e.target.type = 'datetime-local'} 
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} 
                style={{ ...inputStyle, cursor: 'pointer' }} 
                required 
              />
            </div>
            <div>
              <label style={labelStyle}>ΛΗΞΗ *</label>
              <input 
                name="endDateTime" 
                type={form.endDateTime ? "datetime-local" : "text"} 
                placeholder="Επιλέξτε ημερομηνία & ώρα" 
                value={form.endDateTime} 
                onChange={handleChange} 
                onFocus={(e) => e.target.type = 'datetime-local'} 
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} 
                style={{ ...inputStyle, cursor: 'pointer' }} 
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>ΓΕΩΓΡ. ΠΛΑΤΟΣ</label>
              <input name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} style={inputStyle} placeholder="π.χ. 37.9838" />
            </div>
            <div>
              <label style={labelStyle}>ΓΕΩΓΡ. ΜΗΚΟΣ</label>
              <input name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} style={inputStyle} placeholder="π.χ. 23.7275" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>ΚΑΤΗΓΟΡΙΕΣ (χωρισμένες με κόμμα)</label>
            <input name="categories" value={form.categories} onChange={handleChange} style={inputStyle} placeholder="π.χ. Μουσική, Live Performance" />
          </div>

          <div style={{ marginTop: '10px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '20px' }}>
            <h2 style={{ fontSize: '11px', letterSpacing: '2px', color: COLORS.dark, fontWeight: '700', marginBottom: '16px' }}>ΤΥΠΟΙ ΕΙΣΙΤΗΡΙΩΝ</h2>
            
            {ticketTypes.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', marginBottom: '12px', alignItems: 'end' }}>
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
                <button type="button" onClick={() => removeTicket(i)} style={{ padding: '12px', backgroundColor: '#e53935', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
            
            <button type="button" onClick={addTicket} style={{ padding: '10px 20px', backgroundColor: 'transparent', border: `1px solid ${COLORS.primary}`, color: COLORS.dark, borderRadius: '60px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '12px', fontWeight: '600', marginTop: '5px' }}>
              + ΠΡΟΣΘΗΚΗ ΤΥΠΟΥ ΕΙΣΙΤΗΡΙΟΥ
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '14px', backgroundColor: COLORS.primary, color: COLORS.dark, border: 'none', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontWeight: '700', letterSpacing: '1px', fontSize: '13.5px', borderRadius: '60px', transition: '0.2s' }}>
              {loading ? 'ΑΠΟΘΗΚΕΥΣΗ...' : isEditMode ? 'ΑΠΟΘΗΚΕΥΣΗ ΑΛΛΑΓΩΝ' : 'ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ'}
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