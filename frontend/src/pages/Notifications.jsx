import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  bgLight: '#f9f7f5',
  white: '#ffffff',
  border: '#e4dfda',
  textMuted: '#666',
  success: '#27500A', 
  danger: '#791F1F',  
  info: '#2a5a7a'     
};

const cleanString = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const getTagInfo = (type) => {
  switch (type?.toUpperCase()) {
    case 'NEW_BOOKING':
      return { label: 'ΝΕΑ ΚΡΑΤΗΣΗ', bg: 'rgba(210, 184, 147, 0.2)', color: COLORS.primary };
    case 'EVENT_UPDATED':
      return { label: 'ΑΛΛΑΓΗ ΕΚΔΗΛΩΣΗΣ', bg: 'rgba(210, 184, 147, 0.2)', color: COLORS.primary };
    case 'EVENT_CANCELLED':
      return { label: 'ΑΚΥΡΩΣΗ ΕΚΔΗΛΩΣΗΣ', bg: 'rgba(121, 31, 31, 0.1)', color: COLORS.danger };
    case 'NEW_MESSAGE':
      return { label: 'ΝΕΟ ΜΗΝΥΜΑ', bg: 'rgba(210, 184, 147, 0.2)', color: COLORS.primary };
    case 'PROFILE_UPDATE':
    case 'PROFILE_UPDATED':
      return { label: 'ΑΛΛΑΓΗ ΣΤΟΙΧΕΙΩΝ ΧΡΗΣΤΗ', bg: 'rgba(210, 184, 147, 0.2)', color: COLORS.primary };
    
    default:
      return { label: 'ΕΙΔΟΠΟΙΗΣΗ', bg: 'rgba(100, 100, 100, 0.1)', color: COLORS.textMuted };
  }
};

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [myEventTitles, setMyEventTitles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isOrganizer = user?.role?.toUpperCase() === 'ORGANIZER';
  const currentUserId = user?.id || user?.user_id;

  useEffect(() => {
    fetchNotificationsAndEvents();
  }, []);

  const fetchNotificationsAndEvents = async () => {
    try {
      setLoading(true);
      
      const eventsResponse = await api.get('/events');
      let organizerTitles = [];
      
      if (isOrganizer) {
        organizerTitles = eventsResponse.data
          .filter(e => 
            String(e.organizerId) === String(currentUserId) || 
            String(e.organizer_id) === String(currentUserId) || 
            String(e.Organizer?.UserID) === String(currentUserId)
          )
          .map(e => cleanString(e.title));
        
        setMyEventTitles(organizerTitles);
      }

      const response = await api.get('/notifications');
      setNotifications(response.data);
      
      if (response.data.some(n => !n.isRead)) {
        await api.post('/notifications/read');
      }
    } catch (error) {
      console.error("Error fetching notifications or events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      const type = notif.type?.toUpperCase();
      const messageClean = cleanString(notif.message); // Καθαρισμός κειμένου για ασφαλή έλεγχο

      // 1. Έλεγχος αν πρόκειται για Τροποποίηση Προφίλ (είτε από type είτε από το κείμενο)
      if (
        type === 'PROFILE_UPDATE' || 
        type === 'PROFILE_UPDATED' || 
        messageClean.includes('τροποποιηση προφιλ') || 
        messageClean.includes('αλλαξε τα στοιχεια')
      ) {
        navigate('/admin/users'); // 👈 Σε στέλνει κατευθείαν στη διαχείριση χρηστών!
        return;
      }
      
      // 2. Αν η ειδοποίηση αφορά νέο μήνυμα (απλή συνομιλία)
      if (type === 'NEW_MESSAGE') {
        navigate('/messages');
        return;
      }

      let targetEventId = notif.eventId || notif.event_id || notif.EventId;

      if (!targetEventId && notif.message) {
        try {
          const eventsResponse = await api.get('/events');
          const allEvents = eventsResponse.data;

          const matchedEvent = allEvents.find(e => {
            if (!e.title) return false;
            return notif.message.toLowerCase().includes(e.title.toLowerCase());
          });

          if (matchedEvent) {
            targetEventId = matchedEvent.id || matchedEvent.event_id;
          }
        } catch (eErr) {
          console.error("❌ Σφάλμα κατά την αναζήτηση εκδήλωσης με τίτλο:", eErr);
        }
      }

      if (targetEventId && targetEventId !== 'undefined' && targetEventId !== 'null') {
        navigate(`/events/${targetEventId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error("❌ Σφάλμα κατά το κλικ της ειδοποίησης:", err);
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
        {(() => {
          const seen = new Set();
          
          const filteredNotifications = notifications.filter(notif => {
            const type = notif.type?.toUpperCase();
            const textToSearchClean = cleanString(notif.message);

            if (isOrganizer) {
              // 1. Ο Organizer θέλει να βλέπει Κρατήσεις, Αλλαγές και Ακυρώσεις εκδηλώσεων
              const isValidType = 
                type === 'NEW_BOOKING' || 
                type === 'EVENT_UPDATED' || 
                type === 'EVENT_CANCELLED' ||
                textToSearchClean.includes('κρατηση') || 
                textToSearchClean.includes('αλλαξε') || 
                textToSearchClean.includes('ακυρωθηκε') ||
                textToSearchClean.includes('booking');
                
              if (!isValidType) return false;

              // 2. Έλεγχος αν η ειδοποίηση αφορά όντως δική του εκδήλωση (βάσει τίτλου)
              const belongsToMe = myEventTitles.some(title => textToSearchClean.includes(title));
              if (!belongsToMe) return false;
            }

            // Αφαίρεση διπλότυπων ειδοποιήσεων
            const uniqueKey = `${notif.message}-${notif.createdAt}`;
            if (seen.has(uniqueKey)) return false;
            seen.add(uniqueKey);
            
            return true;
          });

          if (filteredNotifications.length === 0) {
            return <p style={styles.emptyMsg}>Δεν έχετε νέες ειδοποιήσεις.</p>;
          }

          return filteredNotifications.map((notif) => {
            const { label, bg: tagBgColor, color: tagColor } = getTagInfo(notif.type);

            return (
              <div 
                key={notif.id} 
                onClick={() => handleNotificationClick(notif)}
                style={{
                  ...styles.card,
                  borderLeft: `5px solid ${tagColor}`,
                  backgroundColor: notif.isRead ? COLORS.white : '#fffdfa',
                  cursor: 'pointer' 
                }}
              >
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.typeTag, backgroundColor: tagBgColor, color: tagColor }}>
                    {label}
                  </span>
                  <span style={styles.date}>{notif.createdAt ? new Date(notif.createdAt).toLocaleString('el-GR') : '—'}</span>
                </div>
                <p style={styles.message}>
                  {notif.message ? notif.message.split('|||')[0] : 'Χωρίς περιεχόμενο'}
                </p> 
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '40px 10%', backgroundColor: COLORS.bgLight, minHeight: '100vh' },
  title: { fontSize: '1.9rem', fontWeight: '800', color: COLORS.dark, marginBottom: '30px', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px', margin: '0 auto' },
  card: { padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' },
  cardHeader: { display: 'flex', marginBottom: '10px', justifyContent: 'space-between' },
  typeTag: { fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px' },
  date: { fontSize: '0.8rem', color: '#999' },
  message: { fontSize: '1rem', color: COLORS.dark, margin: 0, lineHeight: '1.5' },
  emptyMsg: { textAlign: 'center', color: COLORS.textMuted, marginTop: '50px' }
};

export default Notifications;