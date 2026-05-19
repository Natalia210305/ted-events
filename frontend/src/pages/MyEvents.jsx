import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const statusColors = {
  DRAFT: '#888', PUBLISHED: '#4caf50', CANCELLED: '#e53935', COMPLETED: '#2196f3'
};
const statusLabels = {
  DRAFT: 'ΠΡΟΣΧΕΔΙΟ', PUBLISHED: 'ΔΗΜΟΣΙΕΥΜΕΝΗ', CANCELLED: 'ΑΚΥΡΩΜΕΝΗ', COMPLETED: 'ΟΛΟΚΛΗΡΩΜΕΝΗ'
};

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/my');
      setEvents(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης εκδηλώσεων');
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handlePublish = async (id) => {
    try {
      await api.patch(`/events/${id}`, { status: 'PUBLISHED' });
      fetchEvents();
    } catch (err) {
      setError('Σφάλμα δημοσίευσης');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ακυρώσετε την εκδήλωση;')) return;
    try {
      await api.patch(`/events/${id}`, { status: 'CANCELLED' });
      fetchEvents();
    } catch (err) {
      setError('Σφάλμα ακύρωσης');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε την εκδήλωση;')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || 'Σφάλμα διαγραφής');
    }
  };

  const formatDate = (str) => new Date(str).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Montserrat, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px' }}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</h1>
          <button onClick={() => navigate('/create-event')} style={{ padding: '10px 24px', backgroundColor: '#d2b893', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '700', letterSpacing: '1px' }}>
            + ΝΕΑ ΕΚΔΗΛΩΣΗ
          </button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', color: '#888' }}>
            Δεν έχετε δημιουργήσει εκδηλώσεις ακόμα.
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} style={{ backgroundColor: 'white', padding: '24px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '4px' }}>{event.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#888' }}>
                  {formatDate(event.startDateTime)} · {event.city} · {event.capacity} θέσεις
                </div>
                <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px' }}>
                  Κρατήσεις: {event.bookings?.length || 0}
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: statusColors[event.status], letterSpacing: '1px' }}>
                {statusLabels[event.status]}
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {event.status === 'DRAFT' && (
                  <button onClick={() => handlePublish(event.id)} style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem' }}>
                    ΔΗΜΟΣΙΕΥΣΗ
                  </button>
                )}
                {event.status === 'PUBLISHED' && (
                  <button onClick={() => handleCancel(event.id)} style={{ padding: '8px 16px', backgroundColor: '#e53935', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem' }}>
                    ΑΚΥΡΩΣΗ
                  </button>
                )}
                <button onClick={() => navigate(`/events/${event.id}`)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #d2b893', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem' }}>
                  ΠΡΟΒΟΛΗ
                </button>
                {/* ── ΤΟ ΝΕΟ ΚΟΥΜΠΙ ΕΠΕΞΕΡΓΑΣΙΑΣ ── */}
                {event.status !== 'CANCELLED' && (
                  <button 
                    onClick={() => navigate('/create-event', { state: { editEvent: event } })} 
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: '#d2b893', // Μπεζ/Χρυσό για να ταιριάζει με το brand σου
                      color: '#2c2c2c', 
                      border: 'none', 
                      fontWeight: '600',
                      cursor: 'pointer', 
                      fontFamily: 'Montserrat, sans-serif', 
                      fontSize: '0.8rem' 
                    }}
                  >
                    ΕΠΕΞΕΡΓΑΣΙΑ
                  </button>
                )}
                {(event.status === 'DRAFT' && event.bookings?.length === 0) && (
                  <button onClick={() => handleDelete(event.id)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #e53935', color: '#e53935', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem' }}>
                    ΔΙΑΓΡΑΦΗ
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}