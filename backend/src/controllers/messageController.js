const prisma = require('../db');

// 1. Αποστολή μηνύματος
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, eventId } = req.body;

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ error: 'Παραλήπτης δεν βρέθηκε' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        receiverId,
        content,
        eventId: eventId || null
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const getMyMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, deletedBySender: false },
          { receiverId: currentUserId, deletedByReceiver: false }
        ]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true } }
      },
      orderBy: { sentAt: 'desc' }
    });

    const threadsMap = new Map();

    for (const msg of allMessages) {
      const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
      if (!otherUser) continue;

      const eventKey = msg.eventId || 'general';
      const threadKey = `${otherUser.id}_${eventKey}`;

      // 🎯 ΥΠΟΛΟΓΙΣΜΟΣ UNREAD: Αν το μήνυμα το λάβαμε εμείς και το readAt είναι null, είναι αδιάβαστο
      const isUnreadForMe = msg.receiverId === currentUserId && msg.readAt === null;

      if (!threadsMap.has(threadKey)) {
        threadsMap.set(threadKey, {
          id: msg.id,
          content: msg.content,
          sentAt: msg.sentAt,
          readAt: msg.readAt,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          eventId: msg.eventId,
          event: msg.event,
          otherUser: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName
          },
          // Ξεκινάμε το μέτρημα των unread για αυτό το thread
          unreadCount: isUnreadForMe ? 1 : 0 
        });
      } else {
        // Αν η συνομιλία υπάρχει ήδη στο χάρτη, και βρούμε κι άλλο unread μήνυμά της, αυξάνουμε το count
        if (isUnreadForMe) {
          const existing = threadsMap.get(threadKey);
          existing.unreadCount += 1;
        }
      }
    }

    res.json(Array.from(threadsMap.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Συνομιλία με συγκεκριμένο χρήστη (Έξυπνο Grouping & Fallback για το Event)
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const queryEventId = req.query.eventId === 'null' || !req.query.eventId ? null : req.query.eventId;

    // 1. Παίρνουμε ΟΛΑ τα μηνύματα μεταξύ των δύο χρηστών για να μην χάνονται
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        event: {
          select: {
            id: true,
            title: true,
            bookings: {
              where: { attendeeId: req.user.id },
              select: { id: true }
            }
          }
        }
      },
      orderBy: { sentAt: 'asc' }
    });

    // 2. 🎯 ΤΟ ΜΑΓΙΚΟ ΦΙΛΤΡΑΡΙΣΜΑ: 
    // Αν η React ζήτησε συγκεκριμένο event, κρατάμε μόνο αυτά.
    // Αν όμως στη βάση όλα είναι NULL, τα αφήνουμε όλα μαζί για να μην σπάνε σε διπλές κάρτες!
    let filteredMessages = messages;
    if (queryEventId) {
      filteredMessages = messages.filter(m => m.eventId === queryEventId);
    } else {
      // Αν η React ζήτησε γενική συνομιλία (null), ελέγχουμε μήπως υπάρχει κάποιο κρυμμένο eventId μέσα στο thread
      const firstFoundEvent = messages.find(m => m.event !== null);
      
      // Αν βρούμε έστω και ένα μήνυμα με event, «μπολιάζουμε» και τα υπόλοιπα null μηνύματα με αυτό το event
      // ώστε η React να δείξει το Header και να μην "ορφανέψει" το chat!
      if (firstFoundEvent) {
        filteredMessages = messages.map(m => ({
          ...m,
          eventId: m.eventId || firstFoundEvent.eventId,
          event: m.event || firstFoundEvent.event
        }));
      }
    }

    // 3. Map για το bookingId
    const formattedMessages = filteredMessages.map(m => {
      const bookingId = m.event?.bookings?.[0]?.id || null;
      return {
        ...m,
        bookingId: bookingId
      };
    });

    res.json(formattedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// 4. Διαγραφή μηνύματος
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ error: 'Μήνυμα δεν βρέθηκε' });

    if (message.senderId === req.user.id) {
      await prisma.message.update({ where: { id }, data: { deletedBySender: true } });
    } else if (message.receiverId === req.user.id) {
      await prisma.message.update({ where: { id }, data: { deletedByReceiver: true } });
    } else {
      return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
    }

    res.json({ message: 'Διαγράφηκε!' });
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// 5. Ανάγνωση μη αναγνωσμένων
const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: req.user.id,
        readAt: null,
        deletedByReceiver: false
      }
    });
    res.json({ unreadCount: count });
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// 6. Σήμανση όλων των μηνυμάτων μιας συνομιλίας ως διαβασμένα
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params; // Το ID του άλλου χρήστη
    
    // Ενημερώνουμε όλα τα μηνύματα που λάβαμε από αυτόν τον χρήστη και είναι unread
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        readAt: null
      },
      data: {
        readAt: new Date() // Βάζουμε το τρέχον timestamp
      }
    });

    res.json({ message: 'Η συνομιλία αναγνώστηκε' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { sendMessage, getMyMessages, getConversation, deleteMessage, getUnreadCount, markAsRead };