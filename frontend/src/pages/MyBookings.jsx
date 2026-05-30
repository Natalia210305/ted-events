import React, { useEffect, useState } from 'react';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  textMuted: '#555555',
  bgLight: '#f9f7f5',
  border: '#e4dfda',
  white: '#ffffff',
};

const STATUS_TRANSLATIONS = {
  confirmed: 'ΕΠΙΒΕΒΑΙΩΜΕΝΗ',
  pending: 'ΣΕ ΕΚΚΡΕΜΟΤΗΤΑ',
  cancelled: 'ΑΚΥΡΩΘΗΚΕ',
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/events/bookings/my');
        setBookings(response.data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Φόρτωση ιστορικού...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '80px' }}>
        <h1 style={{ fontSize: '1.9rem', fontWeight: '800', color: COLORS.dark, letterSpacing: '1px', margin: 0 }}>
          ΤΟ ΙΣΤΟΡΙΚΟ ΤΩΝ ΚΡΑΤΗΣΕΩΝ ΜΟΥ
        </h1>
        <div style={{ width: '130px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} />
      </div>
      
      {bookings.length === 0 ? (
        <p style={{ marginTop: '20px', color: '#666', textAlign: 'center' }}>Δεν έχετε πραγματοποιήσει κάποια κράτηση ακόμα.</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {bookings.map((booking) => (
            <div key={booking.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={{ margin: 0 }}>{booking.event?.title}</h3>
                <span style={styles.statusBadge}>
                  {STATUS_TRANSLATIONS[booking.status?.toLowerCase()] || booking.status}
                </span>
              </div>
              <div style={styles.cardBody}>
                <p><strong>Τοποθεσία:</strong> {booking.event?.venue}, {booking.event?.city}</p>
                <p><strong>Ημερομηνία:</strong> {new Date(booking.event?.startDateTime).toLocaleString('el-GR')}</p>
                <p><strong>Τύπος Εισιτηρίου:</strong> {booking.ticketType?.name} (x{booking.numberOfTickets})</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.primary }}>
                  Σύνολο: €{booking.totalCost}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderLeft: `5px solid ${COLORS.primary}`
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cardBody: {
    lineHeight: '1.6',
    color: '#444'
  }
};

export default MyBookings;