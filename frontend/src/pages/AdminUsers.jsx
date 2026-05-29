import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import api from '../services/api';

// Ομοιόμορφο αντικείμενο χρωμάτων με βάση το MyBookings
const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  textMuted: '#555555',
  bgLight: '#f9f7f5',
  border: '#e4dfda',
  white: '#ffffff',
};

const roleLabels = {
    ADMIN: 'Διαχειριστής',
    ORGANIZER: 'Διοργανωτής',
    ATTENDEE: 'Συμμετέχων'
};

const statusColors = {
    PENDING: '#f0a500',
    APPROVED: '#4caf50',
    REJECTED: '#e53935'
};

const statusLabels = {
    PENDING: 'ΕΚΚΡΕΜΗΣ',
    APPROVED: 'ΕΓΚΕΚΡΙΜΕΝΟΣ',
    REJECTED: 'ΑΠΟΡΡΙΦΘΕΙΣ'
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null); 
  const navigate = useNavigate();
  const location = useLocation(); 

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης χρηστών');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const userIdToOpen = location.state?.openModalForUserId;
    
    if (userIdToOpen && users.length > 0) {
      const triggerAutoModal = async () => {
        try {
          console.log("🔍 Έλεγχος για αυτόματο άνοιγμα modal ID:", userIdToOpen);
          
          const userExists = users.some(u => u.id === userIdToOpen);
          
          if (userExists) {
            setSelectedUser(null); 
            
            const res = await api.get(`/users/${userIdToOpen}`);
            setSelectedUser(res.data);
            console.log("✅ Το modal άνοιξε επιτυχώς για τον χρήστη:", res.data.firstName);
          } else {
            console.warn("⚠️ Το ID από την ειδοποίηση δεν αντιστοιχεί σε απλό χρήστη της λίστασ.");
          }
        } catch (err) {
          console.error("❌ Σφάλμα κατά το αυτόματο άνοιγμα του modal:", err);
        } finally { // 💡 ΔΙΟΡΘΩΘΗΚΕ ΕΔΩ (από finaly σε finally)
          navigate(location.pathname, { replace: true, state: null });
        }
      };

      triggerAutoModal();
    }
  }, [location.state, users]);
  
  const handleApprove = async (id) => {
    try {
      await api.patch(`/users/${id}/approve`);
      fetchUsers();
    } catch (err) {
      setError('Σφάλμα έγκρισης');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/users/${id}/reject`);
      fetchUsers();
    } catch (err) {
      setError('Σφάλμα απόρριψης');
    }
  };

  const handleView = async (id) => {
    try {
      const res = await api.get(`/users/${id}`);
      setSelectedUser(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης στοιχείων');
    }
  };

  const handleOpenChat = (targetUser) => {
    navigate('/messages', {
      state: {
        recipientId: targetUser.id,
        recipientName: `${targetUser.firstName} ${targetUser.lastName}`,
        subject: `Επικοινωνία από τον Διαχειριστή (Λογαριασμός: ${targetUser.username})`,
        eventId: null 
      }
    });
  };

  const pending = users.filter(u => u.status === 'PENDING');
  const rest = users.filter(u => u.status !== 'PENDING');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bgLight, fontFamily: 'Poppins, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Κεντρικός Τίτλος */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontWeight: '800', fontSize: '1.9rem', letterSpacing: '1px', color: COLORS.dark, margin: 0 }}>
            ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ
          </h1>
          <div style={{ width: '150px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} />
        </div>

        {error && <p style={{ color: '#e53935', marginBottom: '16px', textAlign: 'center', fontWeight: '600' }}>{error}</p>}

        {pending.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: COLORS.textMuted, marginBottom: '16px', fontWeight: '700' }}>
              ΕΚΚΡΕΜΕΙΣ ΑΙΤΗΣΕΙΣ ({pending.length})
            </h2>
            {pending.map(user => (
              <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onView={handleView} onChat={handleOpenChat} />
            ))}
          </div>
        )}

        <div>
          <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: COLORS.textMuted, marginBottom: '16px', fontWeight: '700' }}>
            ΟΛΟΙ ΟΙ ΧΡΗΣΤΕΣ ({rest.length})
          </h2>
          {rest.map(user => (
            <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onView={handleView} onChat={handleOpenChat} />
          ))}
        </div>
      </div>

      {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} onChat={handleOpenChat} />}
    </div>
  );
}

function UserCard({ user, onApprove, onReject, onView, onChat }) {
  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderLeft: `5px solid ${statusColors[user.status]}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      lineHeight: '1.6'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '700', fontSize: '1rem', color: COLORS.dark, display: 'flex', alignItems: 'center', gap: '5px' }}>
            {user.role === 'ADMIN' ? (
              <img src="/manager.png" alt="admin" style={{ marginRight: '10px', width: '20px', height: '20px'}} />
            ) : (
              <img src="/profile.png" alt="user" style={{ marginRight: '10px', width: '20px', height: '20px' }} />
            )}
            {user.firstName} {user.lastName}
            <span style={{ fontWeight: '400', color: COLORS.textMuted, marginLeft: '10px', fontSize: '0.85rem' }}>
                ({user.username})
            </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: COLORS.textMuted, marginTop: '4px' }}>
          {user.email} · <span style={{fontWeight: '600', color: COLORS.dark}}>{roleLabels[user.role]}</span>
        </div>
      </div>

      <span style={{ 
        fontSize: '11px', 
        letterSpacing: '0.5px', 
        fontWeight: 'bold', 
        color: statusColors[user.status], 
        backgroundColor: `${statusColors[user.status]}15`, 
        padding: '6px 14px',
        borderRadius: '20px',
        whiteSpace: 'nowrap' 
      }}>
          {statusLabels[user.status]}
      </span>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {user.role !== 'ADMIN' && (
            <button
              onClick={() => onChat(user)}
              style={{ padding: '8px 14px', backgroundColor: COLORS.dark, color: COLORS.white, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ΜΗΝΥΜΑ
            </button>
          )}

          <button
            onClick={() => onView(user.id)}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', color: COLORS.dark, border: `1px solid ${COLORS.primary}`, borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}
          >
            ΠΡΟΒΟΛΗ
          </button>

          {user.status === 'PENDING' && (
            <>
              <button
                onClick={() => onApprove(user.id)}
                style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: COLORS.white, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}
              >
                ΕΓΚΡΙΣΗ
              </button>
              <button
                onClick={() => onReject(user.id)}
                style={{ padding: '8px 16px', backgroundColor: '#e53935', color: COLORS.white, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.5px' }}
              >
                ΑΠΟΡΡΙΨΗ
              </button>
            </>
          )}
      </div>
    </div>
  );
}

function UserDetailsModal({ user, onClose, onChat }) {
    const fields = [
        { label: 'ΟΝΟΜΑ', value: `${user.firstName} ${user.lastName}` },
        { label: 'Username', value: `${user.username}` },
        { label: 'Email', value: user.email },
        { label: 'ΤΗΛΕΦΩΝΟ', value: user.phone },
        { label: 'ΔΙΕΥΘΥΝΣΗ', value: user.address },
        { label: 'ΠΟΛΗ', value: user.city },
        { label: 'ΧΩΡΑ', value: user.country },
        { label: 'ΑΦΜ', value: user.afm },
        { label: 'ΡΟΛΟΣ', value: roleLabels[user.role] },
        { label: 'ΚΑΤΑΣΤΑΣΗ', value: statusLabels[user.status] },
        { label: 'ΕΓΓΡΑΦΗ', value: new Date(user.createdAt).toLocaleDateString('el-GR') },
    ];

    return (
        <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 3000 }} />
        
        <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: COLORS.white,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '40px', 
            zIndex: 3001,
            minWidth: '480px', maxHeight: '85vh',
            overflowY: 'auto', fontFamily: 'Poppins, sans-serif'
        }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: COLORS.textMuted }}>✕</button>

            <h2 style={{ fontWeight: '800', fontSize: '1.4rem', letterSpacing: '0.5px', color: COLORS.dark, marginBottom: '24px', textAlign: 'center' }}>
              ΣΤΟΙΧΕΙΑ ΧΡΗΣΤΗ
            </h2>

            {fields.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, padding: '12px 0', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.5px', color: COLORS.textMuted, width: '130px', flexShrink: 0 }}>
                  {label.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', color: COLORS.dark, fontWeight: '500' }}>
                  {value || '—'}
                </span>
            </div>
            ))}

            {user.role !== 'ADMIN' && (
              <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    onClose();
                    onChat(user);
                  }}
                  style={{ width: '100%', padding: '12px', backgroundColor: COLORS.dark, color: COLORS.white, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.5px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}><img src="/paper-plane.png" alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0}} /> ΑΠΟΣΤΟΛΗ ΜΗΝΥΜΑΤΟΣ ΔΙΕΥΚΡΙΝΙΣΕΩΝ </div>
                </button>
              </div>
            )}
        </div>
        </>
    );
}