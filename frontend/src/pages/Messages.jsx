import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  border: '#e4dfda',
  bgLight: '#f9f7f5',
  darkbrown: '#884834'
};

const styles = {
  container: { display: 'flex', height: 'calc(100vh - 80px)', backgroundColor: '#fff' },
  sidebar: { width: '350px', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '20px', borderBottom: `1px solid ${COLORS.border}`, fontWeight: 'bold', fontSize: '16px', color: COLORS.dark },
  convList: { overflowY: 'auto', flex: 1 },
  convCard: { padding: '15px', borderBottom: `1px solid ${COLORS.border}`, cursor: 'pointer', position: 'relative' },
  chatWindow: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fdfcfb' },
  newMessageArea: { padding: '40px', display: 'flex', flexDirection: 'column' },
  textarea: { height: '200px', padding: '15px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, resize: 'none', marginBottom: '20px' },
  sendBtn: { padding: '12px 24px', backgroundColor: COLORS.dark, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' },
  conversationArea: { display: 'flex', flexDirection: 'column', height: '100%' },
  chatHeader: { padding: '20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', gap: '5px' },
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
  const [selectedConv, setSelectedConv] = useState(null); 
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const navigate = useNavigate(); 
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

  const fetchConversation = async (userId, eventId = null) => {
    try {
      const validEventId = eventId === 'null' || !eventId ? null : eventId;
      const url = validEventId 
        ? `/messages/conversation/${userId}?eventId=${validEventId}`
        : `/messages/conversation/${userId}`;
          
      const res = await api.get(url);
      const resolvedEventId = validEventId || res.data.find(m => m.eventId)?.eventId || null;
      
      setConversation(res.data);
      setSelectedConv({ userId, eventId: resolvedEventId }); 

      await api.put(`/messages/read/${userId}`);
      fetchMessages(); 

      window.dispatchEvent(new Event('messagesRead'));

    } catch (err) {
      setError('Σφάλμα φόρτωσης συνομιλίας');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      const targetEventId = selectedConv.eventId === 'null' ? null : selectedConv.eventId;
      await api.post('/messages', { 
        receiverId: selectedConv.userId, 
        content: newMessage, 
        eventId: targetEventId
      });
      setNewMessage('');
      fetchConversation(selectedConv.userId, targetEventId);
      fetchMessages();
    } catch (err) {
      setError('Σφάλμα αποστολής');
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

      const nextConvId = newContact.recipientId;
      const nextEventId = newContact.eventId;

      alert("Το μήνυμα στάλθηκε!");
      setContent("");
      navigate('/messages', { replace: true, state: null });
      await fetchMessages();
      await fetchConversation(nextConvId, nextEventId);
    } catch (error) {
      console.error("Σφάλμα αποστολής:", error);
    }
  };

  // 🎯 ΟΜΑΔΟΠΟΙΗΣΗ ΣΕ ΜΙΑ ΕΝΙΑΙΑ ΛΙΣΤΑ (MESSENGER STYLE)
  const groupThreads = (rawList) => {
    const map = {};
    rawList.forEach(m => {
      const otherId = m.senderId === user.id ? m.receiverId : m.senderId;
      const key = `${otherId}_release_athens`;
      if (!map[key]) {
        map[key] = m;
      }
    });
    return Object.values(map);
  };

  // Φιλτράρουμε όλα τα ενεργά μηνύματα μαζί (εισερχόμενα και απεσταλμένα)
  const rawActiveMessages = messages.filter(m => 
    (m.receiverId === user?.id && !m.deletedByReceiver) || 
    (m.senderId === user?.id && !m.deletedBySender)
  );

  const chatThreads = groupThreads(rawActiveMessages);
  const unread = chatThreads.reduce((sum, m) => sum + (m.unreadCount || 0), 0);
  const formatDate = (str) => new Date(str).toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      {/* --- ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: ΕΝΙΑΙΑ ΛΙΣΤΑ ΣΥΝΟΜΙΛΙΩΝ --- */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          Συνομιλίες {unread > 0 && <span style={styles.badge}>{unread}</span>}
        </div>

        <div style={styles.convList}>
          {chatThreads.length === 0 ? (
            <p style={styles.emptyMsg}>Δεν υπάρχουν μηνύματα</p>
          ) : (
            chatThreads.map(m => {
              const otherUserId = m.senderId === user.id ? m.receiverId : m.senderId;
              
              let eventName = m.event?.title || m.event_title;
              if (!eventName && m.content && (m.content.includes('εκδήλωση') || m.content.includes('εισιτήριο'))) {
                eventName = "Release Athens Festival";
              }
              
              const foundValidEvent = messages.find(msg => msg.eventId && msg.eventId !== 'null');
              const trueEventId = m.eventId && m.eventId !== 'null' ? m.eventId : (foundValidEvent?.eventId || '00000000-0000-0000-0000-000000000003');
              
              const cardLink = `/events/${trueEventId}`;
              const isSelected = selectedConv?.userId === otherUserId;

              // Έλεγχος αν η συγκεκριμένη συνομιλία έχει αδιάβαστα μηνύματα
              const hasUnread = m.unreadCount > 0;

              return (
                <div 
                  key={m.id} 
                  style={{
                    ...styles.convCard, 
                    backgroundColor: isSelected ? '#f0f0f0' : 'white'
                  }}
                  onClick={() => fetchConversation(otherUserId, m.eventId)}
                >
                  <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                    <span style={{ fontSize: '14px' }}>
                      <Link 
                        to={cardLink} 
                        style={{ 
                          color: '#bfa37a', 
                          textDecoration: 'underline', 
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => e.stopPropagation()} 
                      >
                        Release Athens Festival
                      </Link>
                    </span>
                    <span style={styles.dateText}>{formatDate(m.sentAt)}</span>
                  </div>

                  {/* Αν η συνομιλία έχει unread, η προεπισκόπηση γίνεται bold */}
                  <div style={{
                    ...styles.previewText,
                    fontWeight: hasUnread ? '700' : 'normal',
                    color: hasUnread ? '#2c2c2c' : '#777'
                  }}>
                    {m.senderId === user.id ? 'Εσείς: ' : ''}{m.content}
                  </div>

                  {/* Μικρή κόκκινη βούλα unread στα δεξιά της κάρτας */}
                  {hasUnread && (
                    <span style={{
                      position: 'absolute',
                      right: '15px',
                      bottom: '18px',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#ff4444',
                      borderRadius: '50%'
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- ΔΕΞΙΑ ΠΛΕΥΡΑ: ΠΑΡΑΘΥΡΟ ΣΥΝΟΜΙΛΙΑΣ --- */}
      <div style={styles.chatWindow}>
        {newContact ? (
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
          <div style={styles.conversationArea}>
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333', fontSize: '16px' }}>
                <img 
                  src="/live-chat.png" 
                  alt="Chat Icon" 
                  style={{ width: '22px', height: '22px', objectFit: 'contain' }} 
                />
                <span>
                  {user?.role?.toUpperCase() === 'ORGANIZER' ? "Συνομιλία με τον χρήστη" : "Συνομιλία με τον διαχειριστή"}
                </span>
              </div>
              
              {user?.role?.toUpperCase() === 'ORGANIZER' && conversation.length > 0 && (() => {
                const clientMsg = conversation.find(c => c.senderId !== user.id);
                const clientData = clientMsg ? clientMsg.sender : conversation[0]?.receiver;

                if (!clientData) return null;

                return (
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#555', 
                    marginTop: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px',
                    borderLeft: `3px solid ${COLORS.primary}`,
                    marginLeft: '32px',
                    paddingLeft: '12px'
                  }}>
                    {/* Ονοματεπώνυμο */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src="/user.png" alt="User" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      <span>
                        <span style={{ fontWeight: '500' }}>Ονοματεπώνυμο:</span>{' '}
                        <span style={{ fontWeight: '700', color: COLORS.darkbrown }}>
                          {clientData.firstName} {clientData.lastName}
                        </span>
                      </span>
                    </div>

                    {/* Email */}
                    {clientData.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/mail.png" alt="Email" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        <span>
                          <span style={{ fontWeight: '500' }}>Email:</span>{' '}
                          <a href={`mailto:${clientData.email}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>
                            {clientData.email}
                          </a>
                        </span>
                      </div>
                    )}

                    {/* Τηλέφωνο */}
                    {clientData.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/phone.png" alt="Phone" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        <span>
                          <span style={{ fontWeight: '500' }}>Τηλέφωνο:</span>{' '}
                          <a href={`tel:${clientData.phone}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>
                            {clientData.phone}
                          </a>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
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
          <div style={styles.emptyState}>
            <p>Επιλέξτε μια συνομιλία για να δείτε τα μηνύματά σας</p>
          </div>
        )}
      </div>
    </div>
  );
}