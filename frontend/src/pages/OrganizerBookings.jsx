import React, { useEffect, useState } from 'react';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',      
  dark: '#2c2c2c',         
  textMuted: '#666666',
  bgLight: '#fcfaf7',
  border: '#f0eae4',
  white: '#ffffff',
  confirmedBg: '#e6f4ea',
  confirmedText: '#1e7e34',
  pendingBg: '#fef7e0',
  pendingText: '#b06000',
  cancelledBg: '#fce8e6',
  cancelledText: '#d93025'
};

const STATUS_CONFIG = {
  CONFIRMED: { label: 'ΕΠΙΒΕΒΑΙΩΜΕΝΗ', color: COLORS.confirmedText, bg: COLORS.confirmedBg },
  PENDING: { label: 'ΣΕ ΕΚΚΡΕΜΟΤΗΤΑ', color: COLORS.pendingText, bg: COLORS.pendingBg },
  CANCELLED: { label: 'ΑΚΥΡΩΜΕΝΗ', color: COLORS.cancelledText, bg: COLORS.cancelledBg },
};

export default function OrganizerBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrganizerBookings = async () => {
      try {
        const response = await api.get('/events/organizer/bookings');
        setBookings(response.data);
      } catch (err) {
        console.error("Error fetching organizer bookings:", err);
        setError('Σφάλμα κατά τη φόρτωση των κρατήσεων.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizerBookings();
  }, []);

  const formatDate = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' }) + 
           ' · ' + new Date(str).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

  // Φιλτράρισμα μοναδικών events με fallback στον τίτλο αν το id λείπει ή συμπίπτει
  const uniqueEvents = Array.from(
    new Map(
      bookings
        .filter(b => b.event && b.event.title)
        .map(b => {
          const key = b.event.id || b.event.title; 
          return [key, b.event];
        })
    ).values()
  );

  // Φιλτράρισμα των κρατήσεων στην οθόνη
  const filteredBookings = selectedEventId === 'ALL' 
    ? bookings 
    : bookings.filter(b => (b.event?.id === selectedEventId || b.event?.title === selectedEventId));

  // ΥΠΟΛΟΓΙΣΜΟΣ ΕΣΟΔΩΝ: Αθροίζει το totalCost μόνο των φιλτραρισμένων κρατήσεων
  const totalRevenue = filteredBookings.reduce((sum, booking) => sum + Number(booking.totalCost || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', fontFamily: 'Poppins, sans-serif' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: '600', color: COLORS.dark }}>Φόρτωση ιστορικού κρατήσεων...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bgLight, fontFamily: 'Poppins, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* ─── HEADER AREA ─── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',    
          marginBottom: '40px',
          width: '100%',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '800', 
              color: COLORS.dark, 
              letterSpacing: '1px', 
              margin: 0 
            }}>
              ΙΣΤΟΡΙΚΟ ΚΡΑΤΗΣΕΩΝ & ΠΩΛΗΣΕΩΝ
            </h1>
            <div style={{ 
              width: '110px', 
              height: '4px', 
              backgroundColor: COLORS.primary, 
              marginTop: '8px', 
              marginRight: 'auto', 
              marginLeft: 'auto' 
            }} />
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: '0.9rem', marginTop: '22px', marginBottom: '20px', textAlign: 'center' }}>
            Δείτε ποιοι χρήστες έχουν πραγματοποιήσει κρατήσεις για τις εκδηλώσεις σας.
          </p>

          {/* ─── ΔΥΝΑΜΙΚΟ ΦΙΛΤΡΟ ΕΚΔΗΛΩΣΕΩΝ ─── */}
          {bookings.length > 0 && (
            <div style={{ width: '100%', maxWidth: '400px', marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: COLORS.dark, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                Φιλτραρισμα ανα Εκδηλωση
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: COLORS.dark,
                  backgroundColor: COLORS.white,
                  border: `2px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.01)',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = COLORS.primary}
                onBlur={(e) => e.target.style.borderColor = COLORS.border}
              >
                <option value="ALL">Όλες οι εκδηλώσεις ({uniqueEvents.length})</option>
                {uniqueEvents.map(event => (
                  <option key={event.id || event.title} value={event.id || event.title}>
                    {event.title ? event.title.normalize('NFD').replace(/[\u0300-\u036f]/g, "") : '—'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p style={{ 
            color: COLORS.cancelledText, 
            backgroundColor: COLORS.cancelledBg, 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            fontSize: '0.9rem' 
          }}>
            {error}
          </p>
        )}

        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: COLORS.white, color: '#888', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px dashed ${COLORS.border}` }}>
            {selectedEventId === 'ALL' 
              ? 'Δεν έχουν πραγματοποιηθεί κρατήσεις από συμμετέχοντες ακόμα.' 
              : 'Δεν υπάρχουν κρατήσεις για τη συγκεκριμένη εκδήλωση.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredBookings.map((booking) => {
              const statusInfo = STATUS_CONFIG[booking.bookingStatus?.toUpperCase()] || { label: booking.bookingStatus, color: COLORS.dark, bg: '#f1f3f4' };

              return (
                <div 
                  key={booking.id || booking.bookingID} 
                  style={{ 
                    backgroundColor: COLORS.white, 
                    padding: '28px', 
                    borderRadius: '16px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
                    border: `1px solid ${COLORS.border}`, 
                    gap: '24px' 
                  }}
                >
                  
                  {/* Στοιχεία Κράτησης (Αριστερά) */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: '700', 
                        color: COLORS.dark, 
                        letterSpacing: '0.5px', 
                        textTransform: 'uppercase', 
                        marginBottom: '8px',
                        display: 'inline-block', 
                        borderBottom: `2px solid ${COLORS.primary}`, 
                        paddingBottom: '2px' 
                    }}>
                      {booking.event?.title 
                        ? booking.event.title.normalize('NFD').replace(/[\u0300-\u036f]/g, "") 
                        : '—'}
                    </div>
                    
                    {/* Σειρά Συμμετέχοντα + Status Pill δίπλα-δίπλα */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.15rem', color: COLORS.dark }}>
                        <img 
                          src="/user.png" 
                          alt="" 
                          style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} 
                        /> {booking.attendee?.username || booking.attendeeId || 'Άγνωστος Χρήστης'}
                      </div>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.5px', backgroundColor: statusInfo.bg, color: statusInfo.color, textTransform: 'uppercase' }}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Δευτερεύουσες Πληροφορίες */}
                    <div style={{ fontSize: '0.88rem', color: COLORS.textMuted, display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="/ticket.png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} />{booking.ticketType?.name || 'Γενική Είσοδος'} (x{booking.numberOfTickets})</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="/calendar (1).png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} />Ώρα κράτησης: {formatDate(booking.time)}</div>
                    </div>
                  </div>

                  {/* Οικονομικά Στοιχεία (Δεξιά) */}
                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '0.75rem', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>
                      Εσοδο
                    </div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: COLORS.dark, marginTop: '2px' }}>
                      €{Number(booking.totalCost).toFixed(2)}
                    </div>
                  </div>

                </div>
              );
            })}

            {/* ─── ΣΥΝΟΛΙΚΑ ΕΣΟΔΑ (ΚΑΤΩ ΜΕΡΟΣ) ─── */}
            <div 
              style={{ 
                backgroundColor: COLORS.white, 
                padding: '24px 32px', 
                borderRadius: '16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                boxShadow: '0 10px 30px rgba(210, 184, 147, 0.15)', // Ελαφρύ χρυσό shadow
                border: `2px solid ${COLORS.primary}`, // Έντονο περίγραμμα για να ξεχωρίζει
                marginTop: '15px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img 
                    src="/financial-profit.png" 
                    alt="" 
                    style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} 
                /> 
                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: COLORS.dark, letterSpacing: '0.5px' }}>
                    {selectedEventId === 'ALL' ? 'ΣΥΝΟΛΙΚΑ ΕΣΟΔΑ ΟΛΩΝ ΤΩΝ ΕΚΔΗΛΩΣΕΩΝ' : 'ΣΥΝΟΛΙΚΑ ΕΣΟΔΑ ΕΚΔΗΛΩΣΗΣ'}
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '900', color: COLORS.dark }}>
                €{totalRevenue.toFixed(2)}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}