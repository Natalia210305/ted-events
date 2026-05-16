import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
  const [selectedUser, setSelectedUser] = useState(null); // ← για το modal
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης χρηστών');
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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

  const pending = users.filter(u => u.status === 'PENDING');
  const rest = users.filter(u => u.status !== 'PENDING');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Montserrat, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ textAlign: 'center', fontWeight: '700', fontSize: '1.5rem', letterSpacing: '2px', color: 'black' }}>
            ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ
          </h1>
          <button
            onClick={() => navigate('/events')}
            style={{ padding: '10px 24px', backgroundColor: '#d2b893', border: '1px solid black', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px', fontSize: '0.8rem' }}
          >
            ΕΚΔΗΛΩΣΕΙΣ
          </button>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

        {pending.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', marginBottom: '16px' }}>
              ΕΚΚΡΕΜΕΙΣ ΑΙΤΗΣΕΙΣ ({pending.length})
            </h2>
            {pending.map(user => (
              <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onView={handleView} />
            ))}
          </div>
        )}

        <div>
          <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', marginBottom: '16px' }}>
            ΟΛΟΙ ΟΙ ΧΡΗΣΤΕΣ ({rest.length})
          </h2>
          {rest.map(user => (
            <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} onView={handleView} />
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '60px'}}>
            <img src="/account-manager (1).png" alt="" style={{ width: '150px' }} />
      </div>

      {/* Modal στοιχείων χρήστη */}
      {selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserCard({ user, onApprove, onReject, onView }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px 24px',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#2c2c2c', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {user.role === 'ADMIN' ? (
            <img src="/manager.png" alt="admin" style={{ marginRight: '10px', width: '20px', height: '20px'}} />
            ) : (
            <img src="/profile.png" alt="user" style={{ marginRight: '10px', width: '20px', height: '20px' }} />
            )}
            {user.firstName} {user.lastName}
            <span style={{ fontWeight: '400', color: '#888', marginLeft: '10px', fontSize: '0.85rem' }}>
                {user.username}
            </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px' }}>
            {user.email} · <span style={{fontWeight: '600'}}>{roleLabels[user.role]}</span>
            </div>
        </div>

        <span style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600', color: statusColors[user.status], whiteSpace: 'nowrap' }}>
            {statusLabels[user.status]}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
            {/* Κουμπί προβολής πάντα εμφανές */}
            <button
            onClick={() => onView(user.id)}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#2c2c2c', border: '1px solid #d2b893', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', letterSpacing: '1px' }}
            >
            ΠΡΟΒΟΛΗ ΣΤΟΙΧΕΙΩΝ
            </button>

            {user.status === 'PENDING' && (
            <>
                <button
                onClick={() => onApprove(user.id)}
                style={{ padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', letterSpacing: '1px' }}
                >
                ΕΓΚΡΙΣΗ
                </button>
                <button
                onClick={() => onReject(user.id)}
                style={{ padding: '8px 16px', backgroundColor: '#e53935', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: '0.8rem', letterSpacing: '1px' }}
                >
                ΑΠΟΡΡΙΨΗ
                </button>
            </>
            )}
        </div>
        </div>
           
    );
    }

    function UserDetailsModal({ user, onClose }) {
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
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
        <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#faf8f5',
            padding: '40px', zIndex: 101,
            minWidth: '400px', maxHeight: '85vh',
            overflowY: 'auto', fontFamily: 'Montserrat, sans-serif'
        }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✕</button>

            <h2 style={{ fontWeight: '700', letterSpacing: '1px', color: '#2c2c2c', marginBottom: '24px', textAlign: 'center' }}>
            ΣΤΟΙΧΕΙΑ ΧΡΗΣΤΗ
            </h2>

            {fields.map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', borderBottom: '1px solid #ece8e1', padding: '10px 0' }}>
                <span style={{ fontSize: '0.8rem', letterSpacing: '1px', color: '#888', width: '120px', flexShrink: 0 }}>
                {label.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#2c2c2c' }}>
                {value || '—'}
                </span>
            </div>
            ))}
        </div>
        </>
    );
}