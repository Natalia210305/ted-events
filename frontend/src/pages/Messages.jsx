import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();
  const newContact = location.state;

  const [threads, setThreads] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [content, setContent] = useState(newContact?.content || '');

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isOrganizer = user?.role?.toUpperCase() === 'ORGANIZER';

  const formatDate = (str) =>
    new Date(str).toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages/my');
      setThreads(res.data);
    } catch (err) {
      setError('Σφάλμα φόρτωσης μηνυμάτων');
    }
  };

  const fetchConversation = async (userId, eventId = null) => {
    try {
      const validEventId = eventId && eventId !== 'null' && eventId !== 'general' ? eventId : null;
      const url = validEventId
        ? `/messages/conversation/${userId}?eventId=${validEventId}`
        : `/messages/conversation/${userId}`;

      const res = await api.get(url);
      setConversation(res.data);
      setSelectedConv({ userId, eventId: validEventId });

      const readUrl = validEventId 
        ? `/messages/read/${userId}?eventId=${validEventId}`
        : `/messages/read/${userId}`;
      await api.put(readUrl);
      
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.otherUser?.id === userId && (t.eventId || null) === validEventId
            ? { ...t, unreadCount: 0 } 
            : t
        )
      );

      fetchMessages();
      window.dispatchEvent(new Event('messagesRead'));
    } catch (err) {
      setError('Σφάλμα φόρτωσης συνομιλίας');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      await api.post('/messages', {
        receiverId: selectedConv.userId,
        content: newMessage,
        eventId: selectedConv.eventId || null
      });
      setNewMessage('');
      fetchConversation(selectedConv.userId, selectedConv.eventId);
    } catch (err) {
      setError('Σφάλμα αποστολής');
    }
  };

  const handleSendNewMessage = async () => {
    if (!content.trim() || !newContact) return;
    try {
      const targetEventId = newContact.eventId && newContact.eventId !== 'null' ? newContact.eventId : null;
      const payload = {
        receiverId: newContact.recipientId,
        content: content,
      };

      if (targetEventId) {
        payload.eventId = targetEventId;
      }
      await api.post('/messages', payload);
      alert('Το μήνυμα στάλθηκε επιτυχώς!');
      setContent('');
      await fetchMessages();
      await fetchConversation(newContact.recipientId, targetEventId);
      navigate('/messages', { replace: true, state: null });
    } catch (error) {
      console.error('Σφάλμα αποστολής νέου μηνύματος:', error);
      setError('Σφάλμα κατά την αποστολή του μηνύματος.');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [newContact]);

  const unread = threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);

  return (
    <div style={styles.container}>
      {/* ── ΑΡΙΣΤΕΡΑ: ΛΙΣΤΑ ΣΥΝΟΜΙΛΙΩΝ ── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          Συνομιλίες {unread > 0 && <span style={styles.badge}>{unread}</span>}
        </div>

        <div style={styles.convList}>
          {threads.length === 0 ? (
            <p style={styles.emptyMsg}>Δεν υπάρχουν μηνύματα</p>
          ) : (
            threads.map(t => {
              const isSelected =
                selectedConv?.userId === t.otherUser?.id &&
                selectedConv?.eventId === (t.eventId || null);

              const hasUnread = !isSelected && t.senderId !== user.id && t.unreadCount > 0;

              const otherUserName = t.otherUser
                ? `${t.otherUser.firstName || ''} ${t.otherUser.lastName || ''}`.trim()
                : 'Χρήστης';

              // 🌟 ΑΠΟΛΥΤΗ ΔΙΟΡΘΩΣΗ ΤΙΤΛΟΥ ΛΙΣΤΑΣ: 
              // Αν δεν υπάρχει eventId, εξάγουμε το θέμα από τις αγκύλες. Αν αποτύχει, παίρνουμε τις πρώτες λέξεις του μηνύματος!
              let eventTitle = t.event?.title || 'Γενική Επικοινωνία';
              if (!t.eventId && t.content) {
                const match = t.content.match(/\[ΘΕΜΑ:\s*(.*?)\]/);
                if (match && match[1]) {
                  eventTitle = `Θέμα: ${match[1]}`;
                } else {
                  // Αν για οποιονδήποτε λόγο δεν βρει το pattern, παίρνει τους πρώτους χαρακτήρες για να μη γράψει "Γενική Επικοινωνία"
                  eventTitle = t.content.length > 25 ? t.content.substring(0, 25) + '...' : t.content;
                }
              }

              const cleanPreview = t.content?.replace(/\[ΘΕΜΑ:\s*.*?\]\n?/, '') || '';

              return (
                <div
                  key={t.id}
                  style={{ ...styles.convCard, backgroundColor: isSelected ? '#f0f0f0' : 'white' }}
                  onClick={() => fetchConversation(t.otherUser?.id, t.eventId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#bfa37a', fontWeight: '700' }}>{eventTitle}</span>
                      {(isAdmin || isOrganizer) && (
                        <span style={{ fontSize: '12px', color: COLORS.darkbrown, fontWeight: '500' }}>
                          {otherUserName}
                        </span>
                      )}
                    </span>
                    <span style={styles.dateText}>{formatDate(t.sentAt)}</span>
                  </div>

                  <div style={{
                    ...styles.previewText,
                    fontWeight: hasUnread ? '700' : 'normal',
                    color: hasUnread ? '#2c2c2c' : '#777'
                  }}>
                    {t.senderId === user.id ? 'Εσείς: ' : ''}{cleanPreview}
                  </div>

                  {hasUnread && (
                    <span style={{ position: 'absolute', right: '15px', bottom: '18px', width: '8px', height: '8px', backgroundColor: '#ff4444', borderRadius: '50%' }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={styles.chatWindow}>
        {newContact ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={styles.chatHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333', fontSize: '16px' }}>
                <img src="/live-chat.png" alt="Chat" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                <span style={{ fontWeight: '600' }}>
                  {newContact.isAdminContact 
                    ? 'Επικοινωνία με Διαχειριστή' 
                    : isAdmin
                      ? `Διαχειριστική Επικοινωνία: ${newContact.recipientName}`
                      : (newContact.eventTitle || 'Γενική Επικοινωνία')}
                </span>
              </div>

              {(isAdmin || isOrganizer) && !newContact.isAdminContact && (
                <div style={{ fontSize: '13px', color: '#555', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: `3px solid ${COLORS.primary}`, marginLeft: '32px', paddingLeft: '12px' }}>
                  {!isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src="/user.png" alt="User" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      <span><span style={{ fontWeight: '500' }}>Ονοματεπώνυμο:</span> <span style={{ fontWeight: '700', color: COLORS.darkbrown }}>{newContact.recipientName}</span></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/mail.png" alt="Email" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span><span style={{ fontWeight: '500' }}>Email:</span> <a href={`mailto:${newContact.email || ''}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>{newContact.email || '—'}</a></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/phone.png" alt="Phone" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span><span style={{ fontWeight: '500' }}>Τηλέφωνο:</span> <a href={`tel:${newContact.phone || ''}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>{newContact.phone || '—'}</a></span>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.newMessageArea}>
              <p style={{ fontSize: '14px', color: '#2c2c2c', marginBottom: '20px', fontWeight: '600' }}>
                Θέμα: <span style={{ color: COLORS.darkbrown }}>{newContact.subject}</span>
              </p>
              <textarea
                style={styles.textarea}
                placeholder="Γράψτε το μήνυμά σας εδώ..."
                value={content.replace(/\[ΘΕΜΑ:\s*.*?\]\n?/, '')}
                onChange={(e) => {
                  const prefix = content.match(/\[ΘΕΜΑ:\s*.*?\]\n?/) ? content.match(/\[ΘΕΜΑ:\s*.*?\]\n?/)[0] : `[ΘΕΜΑ: ${newContact.subject}]\n`;
                  setContent(prefix + e.target.value);
                }}
              />
              <button onClick={handleSendNewMessage} style={styles.sendBtn}>ΑΠΟΣΤΟΛΗ ΜΗΝΥΜΑΤΟΣ</button>
            </div>
          </div>
        ) : selectedConv ? (
          <div style={styles.conversationArea}>
            <div style={styles.chatHeader}>
              {(() => {
                const clientMsg = conversation.find(c => c.senderId !== user.id);
                const clientData = clientMsg?.sender || conversation[0]?.receiver || conversation[0]?.sender;
                const otherPartyName = clientData
                  ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim()
                  : 'Χρήστης';

                const currentThread = threads.find(
                  t => t.otherUser?.id === selectedConv.userId && (t.eventId || null) === selectedConv.eventId
                );

                let currentEventTitle = conversation.find(m => m.event?.title)?.event?.title || currentThread?.event?.title || 'Γενική Επικοινωνία';
                
                if (!selectedConv.eventId) {
                  const firstMsgWithSubject = conversation.find(m => m.content?.includes('[ΘΕΜΑ:'));
                  if (firstMsgWithSubject) {
                    const match = firstMsgWithSubject.content.match(/\[ΘΕΜΑ:\s*(.*?)\]/);
                    if (match && match[1]) {
                      currentEventTitle = `Θέμα: ${match[1]}`;
                    }
                  } else if (conversation[0]?.content) {
                    // Αν δεν υπάρχει το tag, παίρνει το πρώτο μήνυμα ως τίτλο θέματος
                    const firstTxt = conversation[0].content;
                    currentEventTitle = firstTxt.length > 25 ? firstTxt.substring(0, 25) + '...' : firstTxt;
                  }
                }

                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333', fontSize: '16px' }}>
                      <img src="/live-chat.png" alt="Chat Icon" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                      <span style={{ fontWeight: '600' }}>
                        {isAdmin ? `Συνομιλία με: ${otherPartyName} (${currentEventTitle})` : currentEventTitle}
                      </span>
                    </div>

                    {(isAdmin || isOrganizer) && clientData && (
                      <div style={{ fontSize: '13px', color: '#555', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: `3px solid ${COLORS.primary}`, marginLeft: '32px', paddingLeft: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img src="/user.png" alt="User" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                          <span><span style={{ fontWeight: '500' }}>Συνομιλητής:</span> <span style={{ fontWeight: '700', color: COLORS.darkbrown }}>{otherPartyName}</span></span>
                        </div>
                        {clientData.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src="/mail.png" alt="Email" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            <span><span style={{ fontWeight: '500' }}>Email:</span> <a href={`mailto:${clientData.email}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>{clientData.email}</a></span>
                          </div>
                        )}
                        {clientData.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src="/phone.png" alt="Phone" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            <span><span style={{ fontWeight: '500' }}>Τηλέφωνο:</span> <a href={`tel:${clientData.phone}`} style={{ color: '#555', textDecoration: 'none', fontWeight: '600' }}>{clientData.phone}</a></span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div style={styles.messagesList}>
              {conversation.map(c => {
                const cleanBubbleContent = c.content?.replace(/\[ΘΕΜΑ:\s*.*?\]\n?/, '') || '';
                
                return (
                  <div key={c.id} style={{
                    ...styles.bubble,
                    alignSelf: c.senderId === user.id ? 'flex-end' : 'flex-start',
                    backgroundColor: c.senderId === user.id ? COLORS.primary : '#eee'
                  }}>
                    {cleanBubbleContent}
                    <div style={styles.bubbleDate}>{formatDate(c.sentAt)}</div>
                  </div>
                );
              })}
            </div>

            <div style={styles.inputBox}>
              <input
                style={styles.chatInput}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Απάντηση..."
              />
              <button 
                type="submit" 
                className="send-image-button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img src="/sent.png" alt="Send" style={{ width: '24px', height: '24px' }} />
              </button>           
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