import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedConv, setSelectedConv] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages/my');
      setMessages(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης μηνυμάτων');
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const fetchConversation = async (userId) => {
    try {
      const res = await api.get(`/messages/conversation/${userId}`);
      setConversation(res.data);
      setSelectedConv(userId);
    } catch (err) {
      setError('Σφάλμα φόρτωσης συνομιλίας');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post('/messages', { receiverId: selectedConv, content: newMessage });
      setNewMessage('');
      fetchConversation(selectedConv);
      fetchMessages();
    } catch (err) {
      setError('Σφάλμα αποστολής');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/messages/${id}`);
      fetchMessages();
      if (selectedConv) fetchConversation(selectedConv);
    } catch (err) {
      setError('Σφάλμα διαγραφής');
    }
  };

  const inbox = messages.filter(m => m.receiverId === user?.id && !m.deletedByReceiver);
  const sent = messages.filter(m => m.senderId === user?.id && !m.deletedBySender);
  const unread = inbox.filter(m => !m.readAt).length;

  const conversations = [...new Map(
    messages.map(m => {
      const otherId = m.senderId === user?.id ? m.receiverId : m.senderId;
      const other = m.senderId === user?.id ? m.receiver : m.sender;
      return [otherId, { userId: otherId, name: `${other.firstName} ${other.lastName}` }];
    })
  ).values()];

  const formatDate = (str) => new Date(str).toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const s = { fontFamily: 'Montserrat, sans-serif' };

  return (
    <div style={{ ...s, minHeight: '100vh', backgroundColor: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '32px' }}>
          ΜΗΝΥΜΑΤΑ {unread > 0 && <span style={{ backgroundColor: '#e53935', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.75rem', marginLeft: '8px' }}>{unread}</span>}
        </h1>

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setActiveTab('inbox')} style={{ flex: 1, padding: '8px', backgroundColor: activeTab === 'inbox' ? '#d2b893' : 'transparent', border: '1px solid #d2b893', cursor: 'pointer', ...s, fontSize: '12px', fontWeight: '600' }}>
                ΕΙΣΕΡΧΟΜΕΝΑ {unread > 0 && `(${unread})`}
              </button>
              <button onClick={() => setActiveTab('sent')} style={{ flex: 1, padding: '8px', backgroundColor: activeTab === 'sent' ? '#d2b893' : 'transparent', border: '1px solid #d2b893', cursor: 'pointer', ...s, fontSize: '12px', fontWeight: '600' }}>
                ΑΠΕΣΤΑΛΜΕΝΑ
              </button>
            </div>

            {conversations.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px', textAlign: 'center' }}>Δεν υπάρχουν συνομιλίες</p>
            ) : (
              conversations.map(conv => (
                <div key={conv.userId} onClick={() => fetchConversation(conv.userId)} style={{ padding: '12px', marginBottom: '8px', backgroundColor: selectedConv === conv.userId ? '#f5f0eb' : 'transparent', cursor: 'pointer', borderLeft: selectedConv === conv.userId ? '3px solid #d2b893' : '3px solid transparent' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{conv.name}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ backgroundColor: 'white', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            {!selectedConv ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '14px' }}>
                Επιλέξτε συνομιλία
              </div>
            ) : (
              <>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', marginBottom: '16px' }}>
                  {conversation.map(msg => (
                    <div key={msg.id} style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: msg.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
                      <div style={{ backgroundColor: msg.senderId === user?.id ? '#d2b893' : '#f5f0eb', padding: '10px 14px', maxWidth: '70%', fontSize: '14px' }}>
                        {msg.content}
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', display: 'flex', gap: '8px' }}>
                        {formatDate(msg.sentAt)}
                        <span onClick={() => handleDelete(msg.id)} style={{ cursor: 'pointer', color: '#e53935' }}>✕</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Γράψτε μήνυμα..." style={{ flex: 1, padding: '10px', border: '1px solid #e4dfda', ...s, fontSize: '14px' }} />
                  <button onClick={handleSend} style={{ padding: '10px 20px', backgroundColor: '#d2b893', border: 'none', cursor: 'pointer', ...s, fontWeight: '700', fontSize: '13px' }}>
                    ΑΠΟΣΤΟΛΗ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}