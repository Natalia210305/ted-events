import React, { useState, useEffect } from 'react';
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

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Φόρτωση ειδοποιήσεων...</div>;

  return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ ...styles.title, marginBottom: 0 }}>ΟΙ ΕΙΔΟΠΟΙΗΣΕΙΣ ΜΟΥ</h2>
        <div style={{ width: '110px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} /> 
      </div>
      <div style={styles.list}>
        {notifications.length === 0 ? (
          <p style={styles.emptyMsg}>Δεν έχετε νέες ειδοποιήσεις.</p>
        ) : (
          notifications.map((notif) => {
            // 🎯 ΑΛΕΞΙΣΦΑΙΡΟΙ ΕΛΕΓΧΟΙ (Safe String Checks με fallback κενό string '')
            const textToSearch = notif.message ? String(notif.message).toLowerCase() : '';
            
            const isRegistration = textToSearch.includes('εγγραφή') || notif.type === 'new_register';
            const isProfileUpdate = textToSearch.includes('στοιχείων') || textToSearch.includes('προφίλ') || textToSearch.includes('τροποποίηση');

            // Καθορισμός του κειμένου στο Tag
            const displayTag = isRegistration 
              ? 'ΔΗΜΙΟΥΡΓΙΑ ΛΟΓΑΡΙΑΣΜΟΥ' 
              : isProfileUpdate 
                ? 'ΑΛΛΑΓΗ ΣΤΟΙΧΕΙΩΝ' 
                : (NOTIF_TRANSLATIONS[notif.type?.toLowerCase()] || notif.type?.replace('_', ' ') || 'ΕΙΔΟΠΟΙΗΣΗ');

            // Δυναμικά χρώματα για το Tag
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
              <div key={notif.id} style={{
                ...styles.card,
                borderLeft: notif.isRead ? `5px solid ${COLORS.border}` : `5px solid ${tagColor}`,
                backgroundColor: notif.isRead ? COLORS.white : '#fffdfa'
              }}>
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
                <p style={styles.message}>{notif.message || 'Χωρίς περιεχόμενο'}</p> 
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '40px 10%',
    backgroundColor: COLORS.bgLight,
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: '30px',
    textAlign: 'center'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  },
  typeTag: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  date: {
    fontSize: '0.8rem',
    color: '#999'
  },
  message: {
    fontSize: '1rem',
    color: COLORS.dark,
    margin: 0,
    lineHeight: '1.5'
  },
  emptyMsg: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: '50px'
  }
};

export default Notifications;