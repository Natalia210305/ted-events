import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const statusStyles = {
  DRAFT: { color: '#5f6368', bg: '#f1f3f4', label: 'ΠΡΟΣΧΕΔΙΟ' },
  PUBLISHED: { color: '#1e7e34', bg: '#e6f4ea', label: 'ΔΗΜΟΣΙΕΥΜΕΝΗ' },
  CANCELLED: { color: '#d93025', bg: '#fce8e6', label: 'ΑΚΥΡΩΜΕΝΗ' },
  COMPLETED: { color: '#1a73e8', bg: '#e8f0fe', label: 'ΟΛΟΚΛΗΡΩΜΕΝΗ' }
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
      await api.patch(`/events/${id}/publish`);
      fetchEvents();
    } catch (err) {
      setError('Σφάλμα δημοσίευσης');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ακυρώσετε την εκδήλωση;')) return;
    try {
      await api.patch(`/events/${id}/cancel`);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfaf7', fontFamily: 'Poppins, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* ─── HEADER AREA ─── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', // Βάζει τα στοιχεία το ένα κάτω από το άλλο
          alignItems: 'center',    // Κεντράρει αρχικά τα πάντα
          marginBottom: '40px',
          width: '100%',
          position: 'relative'
        }}>
          {/* Τίτλος & Γραμμή (Στη Μέση) */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '800', 
              color: '#2c2c2c', // Διορθώθηκε το COLORS.dark για να μην βγάζει σφάλμα
              letterSpacing: '1px', 
              margin: 0 
            }}>
              ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ
            </h1>
            <div style={{ 
              width: '110px', 
              height: '4px', 
              backgroundColor: '#d2b893', 
              marginTop: '8px', 
              marginRight: 'auto', 
              marginLeft: 'auto' // Κεντράρει τη γραμμή κάτω από τον τίτλο
            }} />
          </div>

          {/* Κουμπί Νέα Εκδήλωση (Από Κάτω και Δεξιά) */}
          <button 
            onClick={() => navigate('/create-event')} 
            style={{ 
              marginTop: '20px',          // Δίνει απόσταση από τον τίτλο
              alignSelf: 'flex-end',      // Σπρώχνει ΜΟΝΟ το κουμπί τέρμα δεξιά
              padding: '9px 20px', 
              backgroundColor: '#d2b893', 
              color: '#2c2c2c', 
              border: 'none', 
              borderRadius: '50px', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '0.9rem', 
              fontFamily: 'Poppins, sans-serif',
              boxShadow: '0 4px 15px rgba(210, 184, 147, 0.25)', 
              transition: 'transform 0.2s' 
            }} 
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'} 
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            + ΝΕΑ ΕΚΔΗΛΩΣΗ
          </button>
        </div>

        {error && <p style={{ color: '#d93025', backgroundColor: '#fce8e6', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</p>}

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'white', color: '#888', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px dashed #e4dfda' }}>
            Δεν έχετε δημιουργήσει εκδηλώσεις ακόμα.
          </div>
        ) : (
          events.map(event => {
            const isPastEvent = event.endDateTime ? new Date(event.endDateTime) < new Date() : false;
            const currentStatus = (isPastEvent && event.status !== 'CANCELLED') ? 'COMPLETED' : event.status;
            const styleConfig = statusStyles[currentStatus] || statusStyles.DRAFT;

            // Υπολογισμός διαθέσιμων θέσεων
            const availableSeats = event.ticketTypes && event.ticketTypes.length > 0
              ? event.ticketTypes.reduce((sum, t) => sum + Number(t.available ?? 0), 0)
              : event.capacity;

            return (
              <div key={event.id} style={{ backgroundColor: 'white', padding: '28px', borderRadius: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f0eae4', gap: '24px' }}>
                
                {/* ─── ΑΡΙΣΤΕΡΑ: ΤΙΤΛΟΣ, STATUS PILL & ΛΕΠΤΟΜΕΡΕΙΕΣ (ΟΛΑ ΜΑΖΙ) ─── */}
                <div style={{ flex: 1 }}>
                  {/* Σειρά Τίτλου + Status Pill δίπλα-δίπλα */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.15rem', color: '#2c2c2c' }}>
                      {event.title}
                    </div>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', backgroundColor: styleConfig.bg, color: styleConfig.color, textTransform: 'uppercase' }}>
                      {styleConfig.label}
                    </span>
                  </div>

                  {/* Δευτερεύουσες Πληροφορίες */}
                  <div style={{ fontSize: '0.88rem', color: '#666', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="calendar (1).png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} />{formatDate(event.startDateTime)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="pin.png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} /> {event.city}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="ticket.png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} /> <strong style={{ color: availableSeats > 0 ? '#1e7e34' : '#d93025' }}>{availableSeats} διαθέσιμες</strong> (από {event.capacity}) </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#999', marginTop: '8px', fontWeight: '500' }}>
                    Συνολικές Κρατήσεις: {event.bookings?.length || 0}
                  </div>
                </div>

                {/* ─── ΔΕΞΙΑ: ΚΟΥΜΠΙΑ ΕΝΕΡΓΕΙΩΝ (ΚΑΘΑΡΑ ΚΑΙ ΜΕ ΑΠΟΣΤΑΣΕΙΣ) ─── */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  
                  <button onClick={() => navigate(`/events/${event.id}`)} style={{ padding: '10px 18px', backgroundColor: 'white', border: '1px solid #d2b893', color: '#2c2c2c', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s' }}>
                    ΠΡΟΒΟΛΗ
                  </button>

                  {currentStatus === 'DRAFT' && (
                    <button onClick={() => handlePublish(event.id)} style={{ padding: '10px 18px', backgroundColor: '#1e7e34', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: '600' }}>
                      ΔΗΜΟΣΙΕΥΣΗ
                    </button>
                  )}

                  {currentStatus !== 'CANCELLED' && currentStatus !== 'COMPLETED' && (
                    <>
                      <button 
                        onClick={() => navigate('/create-event', { state: { editEvent: event } })} 
                        style={{ 
                          padding: '10px 18px', 
                          backgroundColor: '#f7ecde', 
                          color: 'black', 
                          border: '1px solid #d2b893', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontFamily: 'Poppins, sans-serif', 
                          fontSize: '0.82rem', 
                          fontWeight: '600',
                        }} 
                      >
                        ΕΠΕΞΕΡΓΑΣΙΑ
                      </button>
                      
                      {currentStatus === 'PUBLISHED' && (
                        <button onClick={() => handleCancel(event.id)} style={{ padding: '10px 18px', backgroundColor: 'transparent', border: '1px solid #d93025', color: '#d93025', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fce8e6'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                          ΑΚΥΡΩΣΗ
                        </button>
                      )}
                    </>
                  )}

                  {(currentStatus === 'DRAFT' && (event.bookings?.length || 0) === 0) && (
                    <button onClick={() => handleDelete(event.id)} style={{ padding: '10px 18px', backgroundColor: 'transparent', border: '1px solid #d93025', color: '#d93025', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: '600' }}>
                      ΔΙΑΓΡΑΦΗ
                    </button>
                  )}

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}