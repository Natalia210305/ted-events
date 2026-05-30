import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  bgLight: '#f9f7f5',
  white: '#ffffff',
  border: '#e4dfda',
  textMuted: '#666'
};

const NOTIF_TRANSLATIONS = {
  'event_cancelled': 'ΑΚΥΡΩΣΗ ΕΚΔΗΛΩΣΗΣ',
  'event cancelled': 'ΑΚΥΡΩΣΗ ΕΚΔΗΛΩΣΗΣ', 
  'event_updated': 'ΕΝΗΜΕΡΩΣΗ ΕΚΔΗΛΩΣΗΣ',
  'event updated': 'ΕΝΗΜΕΡΩΣΗ ΕΚΔΗΛΩΣΗΣ',
  'new_register': 'ΝΕΑ ΕΓΓΡΑΦΗ' 
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
      setLoading(false);
      
      if (response.data.some(n => !n.isRead)) {
        await api.post('/notifications/read');
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    }
  };

  // 🎯 ΠΛΗΡΩΣ ΠΡΟΣΤΑΤΕΥΜΕΝΗ ΣΥΝΑΡΤΗΣΗ NAVIGATION
  const handleNotificationClick = async (notif) => {
    try {
      // ─── ΣΕΝΑΡΙΟ 1: ΑΝ ΕΙΝΑΙ ADMIN ───
      if (isAdmin) {
        const rawMessage = notif.message ? String(notif.message) : '';
        
        // Ελέγχουμε αν η ειδοποίηση έχει το νέο format με το ID
        if (rawMessage.includes('|||')) {
          const parts = rawMessage.split('|||');
          const targetUserId = parts[1];
          
          if (targetUserId && targetUserId !== 'undefined' && targetUserId !== 'null') {
            navigate('/admin/users', { state: { openModalForUserId: targetUserId } });
          }
        } else {
          console.warn("⚠️ Παλιά ειδοποίηση χωρίς κρυμμένο User ID. Δεν γίνεται αυτόματη προβολή.");
          navigate('/admin/users'); // Απλή μεταφορά στη σελίδα χωρίς modal
        }
        return; // Σταματάει εδώ για τον Admin, δεν πάει παρακάτω!
      }

      // ─── ΣΕΝΑΡΙΟ 2: ΑΝ ΕΙΝΑΙ USER/ORGANIZER ───
      const textToSearch = notif.message ? String(notif.message).toLowerCase() : '';
      const isProfileUpdate = textToSearch.includes('στοιχείων') || textToSearch.includes('προφίλ') || textToSearch.includes('τροποποίηση');
      const isRegistration = textToSearch.includes('εγγραφή') || notif.type === 'new_register';

      if (isProfileUpdate || isRegistration) return;

      let targetEventId = notif.eventId || notif.event_id || notif.EventId;

      if (!targetEventId) {
        const res = await api.get('/events');
        const foundEvent = res.data.find(event => {
          const eventTitle = event.title.toLowerCase().trim();
          return textToSearch.includes(eventTitle);
        });

        if (foundEvent) {
          targetEventId = foundEvent.id;
        }
      }

      if (targetEventId) {
        navigate(`/events/${targetEventId}`);
      }
    } catch (err) {
      console.error("❌ Κρασάρισμα κατά το click της ειδοποίησης προστατεύτηκε:", err);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Φόρτωση ειδοποιήσεων...</div>;

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h2 style={{ ...styles.title, marginBottom: 0 }}>ΟΙ ΕΙΔΟΠΟΙΗΣΕΙΣ ΜΟΥ</h2>
        <div style={{ width: '100px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} /> 
      </div>
      <div style={styles.list}>
        {notifications.length === 0 ? (
          <p style={styles.emptyMsg}>Δεν έχετε νέες ειδοποιήσεις.</p>
        ) : (
          notifications.map((notif) => {
            const textToSearch = notif.message ? String(notif.message).toLowerCase() : '';
            
            const isRegistration = textToSearch.includes('εγγραφή') || notif.type === 'new_register';
            const isProfileUpdate = textToSearch.includes('στοιχείων') || textToSearch.includes('προφίλ') || textToSearch.includes('τροποποίηση');

            const displayTag = isRegistration 
              ? 'ΔΗΜΙΟΥΡΓΙΑ ΛΟΓΑΡΙΑΣΜΟΥ' 
              : isProfileUpdate 
                ? 'ΑΛΛΑΓΗ ΣΤΟΙΧΕΙΩΝ' 
                : (NOTIF_TRANSLATIONS[notif.type?.toLowerCase()] || notif.type?.replace('_', ' ') || 'ΕΙΔΟΠΟΙΗΣΗ');

            const tagBgColor = isRegistration 
              ? 'rgba(136, 72, 52, 0.1)' 
              : isProfileUpdate 
                ? 'rgba(44, 44, 44, 0.08)' 
                : 'rgba(210, 184, 147, 0.1)';

            const tagColor = isRegistration 
              ? '#884834' 
              : isProfileUpdate 
                ? '#2c2c2c' 
                : COLORS.primary;

            return (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                style={{
                  ...styles.card,
                  borderLeft: notif.isRead ? `5px solid ${COLORS.border}` : `5px solid ${tagColor}`,
                  backgroundColor: notif.isRead ? COLORS.white : '#fffdfa',
                  cursor: isAdmin && !notif.message?.includes('|||') ? 'default' : 'pointer' 
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={{
                    ...styles.typeTag,
                    backgroundColor: tagBgColor,
                    color: tagColor
                  }}>
                    {displayTag}
                  </span>
                  <span style={styles.date}>{notif.createdAt ? new Date(notif.createdAt).toLocaleString('el-GR') : '—'}</span>
                </div>
                {/* 🎯 Εμφανίζει μόνο το καθαρό κείμενο χωρίς το κρυμμένο ID στην οθόνη */}
                <p style={styles.message}>
                  {notif.message ? notif.message.split('|||')[0] : 'Χωρίς περιεχόμενο'}
                </p> 
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px 10%', backgroundColor: COLORS.bgLight, minHeight: '100vh' },
  title: { fontSize: '1.9rem', fontWeight: '800', color: COLORS.dark, marginBottom: '30px', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '0 auto' },
  card: { padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' },
  cardHeader: { display: 'flex', justifyBox: 'space-between', marginBottom: '10px', justifyContent: 'space-between' },
  typeTag: { fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px' },
  date: { fontSize: '0.8rem', color: '#999' },
  message: { fontSize: '1rem', color: COLORS.dark, margin: 0, lineHeight: '1.5' },
  emptyMsg: { textAlign: 'center', color: COLORS.textMuted, marginTop: '50px' }
};

export default Notifications;