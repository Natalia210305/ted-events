import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  border: '#e4dfda',
  bgLight: '#f9f7f5'
};

const styles = {
  container: { display: 'flex', height: 'calc(100vh - 80px)', backgroundColor: '#fff' },
  sidebar: { width: '350px', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' },
  tabContainer: { display: 'flex', padding: '20px', gap: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' },
  convList: { overflowY: 'auto', flex: 1 },
  convCard: { padding: '15px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer' },
  chatWindow: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fdfcfb' },
  newMessageArea: { padding: '40px', display: 'flex', flexDirection: 'column' },
  textarea: { height: '200px', padding: '15px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, resize: 'none', marginBottom: '20px' },
  sendBtn: { padding: '12px 24px', backgroundColor: COLORS.dark, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' },
  conversationArea: { display: 'flex', flexDirection: 'column', height: '100%' },
  chatHeader: { padding: '20px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 'bold' },
  messagesList: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  bubble: { padding: '10px 15px', borderRadius: '15px', maxWidth: '70%', fontSize: '14px', position: 'relative' },
  bubbleDate: { fontSize: '10px', marginTop: '5px', opacity: 0.6 },
  inputBox: { padding: '20px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: '10px' },
  chatInput: { flex: 1, padding: '10px', borderRadius: '20px', border: `1px solid ${COLORS.border}` },
  replyBtn: { backgroundColor: COLORS.dark, color: 'white', border: 'none', padding: '0 20px', borderRadius: '20px', cursor: 'pointer' },
  emptyState: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' },
  badge: { backgroundColor: '#ff4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', marginLeft: '5px' },
  previewText: { fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '5px' },
  dateText: { fontSize: '10px', color: '#999' },
  emptyMsg: { textAlign: 'center', marginTop: '40px', color: '#999' }
};







export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedConv, setSelectedConv] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const [content, setContent] = useState("");
  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages/my');
      setMessages(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης μηνυμάτων');
    }
  };
  const newContact = location.state;
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

  const handleSendNewMessage = async () => {
    if (!content.trim()) return;
    try {
      await api.post('/messages', {
        receiverId: newContact.recipientId,
        content: content,
        eventId: newContact.eventId
      });
      alert("Το μήνυμα στάλθηκε!");
      setContent("");
      // Εδώ μπορείς να κάνεις navigate στο Inbox για να δεις τη συνομιλία
    } catch (error) {
      console.error("Σφάλμα αποστολής:", error);
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

  const s = { fontFamily: 'Poppins, sans-serif' };

  return (
    <div style={styles.container}>
      {/* --- ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: ΛΙΣΤΑ ΣΥΝΟΜΙΛΙΩΝ --- */}
      <div style={styles.sidebar}>
        <div style={styles.tabContainer}>
          <button 
            style={{...styles.tab, borderBottom: activeTab === 'inbox' ? `2px solid ${COLORS.primary}` : 'none'}}
            onClick={() => setActiveTab('inbox')}
          >
            ΕΙΣΕΡΧΟΜΕΝΑ {unread > 0 && <span style={styles.badge}>{unread}</span>}
          </button>
          <button 
            style={{...styles.tab, borderBottom: activeTab === 'sent' ? `2px solid ${COLORS.primary}` : 'none'}}
            onClick={() => setActiveTab('sent')}
          >
            ΑΠΕΣΤΑΛΜΕΝΑ
          </button>
        </div>

        <div style={styles.convList}>
          {(activeTab === 'inbox' ? inbox : sent).length === 0 ? (
            <p style={styles.emptyMsg}>Δεν υπάρχουν μηνύματα</p>
          ) : (
            (activeTab === 'inbox' ? inbox : sent).map(m => (
              <div 
                key={m.id} 
                style={{
                  ...styles.convCard, 
                  backgroundColor: selectedConv === (m.senderId === user.id ? m.receiverId : m.senderId) ? '#f0f0f0' : 'white',
                  fontWeight: !m.readAt && m.receiverId === user.id ? 'bold' : 'normal'
                }}
                onClick={() => fetchConversation(m.senderId === user.id ? m.receiverId : m.senderId)}
              >
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <span>{m.senderId === user.id ? `${m.receiver.firstName} ${m.receiver.lastName}` : `${m.sender.firstName} ${m.sender.lastName}`}</span>
                  <span style={styles.dateText}>{formatDate(m.sentAt)}</span>
                </div>
                <div style={styles.previewText}>{m.content}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- ΔΕΞΙΑ ΠΛΕΥΡΑ: ΠΑΡΑΘΥΡΟ ΣΥΝΟΜΙΛΙΑΣ --- */}
      <div style={styles.chatWindow}>
        {newContact ? (
          /* ΠΕΡΙΠΤΩΣΗ Α: ΝΕΟ ΜΗΝΥΜΑ ΑΠΟ EVENT */
          <div style={styles.newMessageArea}>
            <h3 style={{color: COLORS.primary, marginBottom: '10px'}}>Νέο μήνυμα προς: {newContact.recipientName}</h3>
            <p style={{fontSize: '13px', color: '#666', marginBottom: '20px'}}>Θέμα: {newContact.subject}</p>
            <textarea
              style={styles.textarea}
              placeholder="Γράψτε το μήνυμά σας εδώ..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button onClick={handleSendNewMessage} style={styles.sendBtn}>ΑΠΟΣΤΟΛΗ ΜΗΝΥΜΑΤΟΣ</button>
          </div>
        ) : selectedConv ? (
          /* ΠΕΡΙΠΤΩΣΗ Β: ΥΠΑΡΧΟΥΣΑ ΣΥΝΟΜΙΛΙΑ */
          <div style={styles.conversationArea}>
            <div style={styles.chatHeader}>
              Συνομιλία με τον χρήστη
            </div>
            <div style={styles.messagesList}>
              {conversation.map(c => (
                <div key={c.id} style={{
                  ...styles.bubble,
                  alignSelf: c.senderId === user.id ? 'flex-end' : 'flex-start',
                  backgroundColor: c.senderId === user.id ? COLORS.primary : '#eee'
                }}>
                  {c.content}
                  <div style={styles.bubbleDate}>{formatDate(c.sentAt)}</div>
                </div>
              ))}
            </div>
            <div style={styles.inputBox}>
              <input 
                style={styles.chatInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Απάντηση..."
              />
              <button style={styles.replyBtn} onClick={handleSend}>ΣΤΕΙΛΕ</button>
            </div>
          </div>
        ) : (
          /* ΠΕΡΙΠΤΩΣΗ Γ: ΤΙΠΟΤΑ ΕΠΙΛΕΓΜΕΝΟ */
          <div style={styles.emptyState}>
            <p>Επιλέξτε μια συνομιλία για να δείτε τα μηνύματά σας</p>
          </div>
        )}
      </div>
    </div>
  );
}