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

    const pending = users.filter(u => u.status === 'PENDING');
    const rest = users.filter(u => u.status !== 'PENDING');

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Montserrat, sans-serif', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontWeight: '700', fontSize: '1.5rem', letterSpacing: '2px', color: '#2c2c2c' }}>
                    ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ
                </h1>
                <button
                    onClick={() => navigate('/events')}
                    style={{ padding: '10px 24px', backgroundColor: 'transparent', border: '1px solid #d2b893', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', letterSpacing: '1px', fontSize: '0.8rem' }}
                >
                    ΕΚΔΗΛΩΣΕΙΣ
                </button>
                </div>

                {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

                {/* Εκκρεμείς αιτήσεις */}
                {pending.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', marginBottom: '16px' }}>
                    ΕΚΚΡΕΜΕΙΣ ΑΙΤΗΣΕΙΣ ({pending.length})
                    </h2>
                    {pending.map(user => (
                    <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} navigate={navigate} />
                    ))}
                </div>
                )}

                {/* Όλοι οι υπόλοιποι χρήστες */}
                <div>
                <h2 style={{ fontSize: '0.9rem', letterSpacing: '2px', color: '#888', marginBottom: '16px' }}>
                    ΟΛΟΙ ΟΙ ΧΡΗΣΤΕΣ ({rest.length})
                </h2>
                {rest.map(user => (
                    <UserCard key={user.id} user={user} onApprove={handleApprove} onReject={handleReject} navigate={navigate} />
                ))}
                </div>
            </div>
        </div>
    );
}

function UserCard({ user, onApprove, onReject, navigate }) {
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
        {/* Στοιχεία χρήστη */}
        <div
            onClick={() => navigate(`/admin/users/${user.id}`)}
            style={{ flex: 1, cursor: 'pointer' }}
        >
            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#2c2c2c' }}>
            {user.firstName} {user.lastName}
            <span style={{ fontWeight: '400', color: '#888', marginLeft: '10px', fontSize: '0.85rem' }}>
                @{user.username}
            </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#888', marginTop: '4px' }}>
            {user.email} · {roleLabels[user.role]}
            </div>
        </div>

        {/* Status badge */}
        <span style={{
            fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600',
            color: statusColors[user.status], whiteSpace: 'nowrap'
        }}>
            {statusLabels[user.status]}
        </span>

        {/* Κουμπιά μόνο για PENDING */}
        {user.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '8px' }}>
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
            </div>
        )}
        </div>
    );
}