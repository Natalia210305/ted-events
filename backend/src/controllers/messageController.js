const prisma = require('../db');

// ─────────────────────────────────────────────────────────────
// POST /api/messages
// Αποστολή νέου μηνύματος
// ─────────────────────────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, eventId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId και content είναι υποχρεωτικά' });
    }

    // 1. Αποθήκευση του μηνύματος στη βάση
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        eventId: eventId && eventId !== 'null' ? eventId : null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true } },
      }
    });

    // 🌟 ΔΙΟΡΘΩΜΕΝΗ ΔΗΜΙΟΥΡΓΙΑ ΕΙΔΟΠΟΙΗΣΗΣ (Notification)
    try {
      const senderName = req.user.role?.toUpperCase() === 'ADMIN' 
        ? 'Ο Διαχειριστής (Admin)' 
        : `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim();

      let notificationMessage = `${senderName} σάς έστειλε ένα νέο μήνυμα.`;
      
      if (content.includes('[ΘΕΜΑ:')) {
        const match = content.match(/\[ΘΕΜΑ:\s*(.*?)\]/);
        if (match && match[1]) {
          notificationMessage = `Νέο μήνυμα από τον Admin με θέμα: "${match[1]}"`;
        }
      }

      // Φτιάχνουμε δυναμικά το αντικείμενο δεδομένων
      const notificationData = {
        userId: receiverId,          // Ο παραλήπτης του μηνύματος (ο Organizer)
        message: notificationMessage,
        type: 'new_message',         // Το type που περιμένει το frontend σου!
        isRead: false
      };

      // 🌟 ΚΛΕΙΔΙ ΑΣΦΑΛΕΙΑΣ: Προσθέτουμε το eventId ΜΟΝΟ αν υπάρχει πραγματικά.
      // Έτσι, αν είναι null, δεν το στέλνουμε καθόλου και η βάση/Prisma δεν θα κρασάρει ποτέ ξανά!
      if (message.eventId) {
        notificationData.eventId = message.eventId;
      }

      await prisma.notification.create({
        data: notificationData
      });
      
      console.log("✅ Η ειδοποίηση νέου μηνύματος δημιουργήθηκε επιτυχώς στη βάση!");
    } catch (notifErr) {
      console.error('❌ Σφάλμα κατά τη δημιουργία του notification (Prisma Error):', notifErr);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Σφάλμα αποστολής μηνύματος' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/messages/my
// Επιστρέφει όλες τις συνομιλίες του χρήστη
// ✅ Ομαδοποιημένες ανά (otherUserId + eventId) — κάθε event = ξεχωριστή συνομιλία
// ✅ Κάθε thread περιέχει event: { id, title } ώστε το frontend να εμφανίζει τον τίτλο
// ─────────────────────────────────────────────────────────────
const getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        // ✅ ΚΛΕΙΔΙ: Φέρνουμε τον τίτλο του event απευθείας
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    // ✅ Ομαδοποίηση: κάθε μοναδικός συνδυασμός (otherUser + eventId) = 1 thread στη λίστα
    const threadsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const eventKey = msg.eventId || 'general';
      const key = `${otherUser.id}_${eventKey}`;

      if (!threadsMap.has(key)) {
        // Αυτό είναι το ΠΙΟ ΠΡΟΣΦΑΤΟ μήνυμα (λόγω desc), το κρατάμε για ημερομηνία & preview κειμένου
        threadsMap.set(key, {
          id: key,
          otherUser,
          eventId: msg.eventId || null,
          event: msg.event || null,
          content: msg.content, // Το κείμενο του τελευταίου μηνύματος για preview
          firstContent: msg.content, // 🌟 ΕΔΩ θα αποθηκεύσουμε το ΠΡΩΤΟ μήνυμα για το Θέμα
          sentAt: msg.sentAt,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          unreadCount: 0
        });
      } else {
        // 🌟 Επειδή πηγαίνουμε από το πιο πρόσφατο στο πιο παλιό (desc), 
        // το τελευταίο msg που θα βρει το loop για αυτό το key είναι το ΠΡΩΤΟ (αρχικό) μήνυμα της συνομιλίας!
        const thread = threadsMap.get(key);
        thread.firstContent = msg.content; 
      }

      // Μετράμε τα αδιάβαστα μηνύματα για τον τρέχοντα χρήστη
      const thread = threadsMap.get(key);
      if (msg.receiverId === userId && msg.readAt === null) {
        thread.unreadCount += 1;
      }
    }

    // ✅ Πριν στείλουμε τα threads, αντικαθιστούμε το content με το firstContent 
    // ΜΟΝΟ αν περιέχει το [ΘΕΜΑ:], ώστε το frontend να διαβάζει ΠΑΝΤΑ το αρχικό θέμα!
    const finalThreads = Array.from(threadsMap.values()).map(thread => {
      if (thread.firstContent && thread.firstContent.includes('[ΘΕΜΑ:')) {
        // Αν το αρχικό μήνυμα είχε θέμα, «μπολιάζουμε» το tag του θέματος στην αρχή του preview
        const match = thread.firstContent.match(/\[ΘΕΜΑ:\s*(.*?)\]/);
        if (match) {
          thread.content = `[ΘΕΜΑ: ${match[1]}] ` + thread.content;
        }
      }
      return thread;
    });

    res.json(finalThreads);
  } catch (err) {
    console.error('getMyMessages error:', err);
    res.status(500).json({ error: 'Σφάλμα φόρτωσης μηνυμάτων' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/messages/conversation/:userId?eventId=xxx
// Επιστρέφει τα μηνύματα μιας συγκεκριμένης συνομιλίας
// ✅ Φιλτράρει και με eventId — άρα κάθε event έχει τη δική του συνομιλία
// ─────────────────────────────────────────────────────────────
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    // ✅ Παίρνουμε το eventId από το query string (?eventId=...)
    const eventId = req.query.eventId && req.query.eventId !== 'null' ? req.query.eventId : null;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ],
        // ✅ Φιλτράρουμε με eventId: αν null, παίρνουμε μόνο τα "Γενικής Επικοινωνίας"
        eventId: eventId ? eventId : null
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        // ✅ Φέρνουμε τον τίτλο και εδώ για να τον εμφανίζει το chat header
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { sentAt: 'asc' } // Χρονολογική σειρά μέσα στη συνομιλία
    });

    res.json(messages);
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ error: 'Σφάλμα φόρτωσης συνομιλίας' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/messages/unread-count
// Αριθμός αδιάβαστων μηνυμάτων
// ─────────────────────────────────────────────────────────────
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null  // ✅ αδιάβαστα = readAt null
      }
    });

    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Σφάλμα μέτρησης αδιάβαστων' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/messages/read/:userId
// Σημειώνει ως διαβασμένα όλα τα μηνύματα από έναν χρήστη
// ─────────────────────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const senderId = req.params.userId;

    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: userId,
        readAt: null  // ✅ μόνο τα αδιάβαστα
      },
      data: { readAt: new Date() }  // ✅ βάζουμε timestamp αντί για isRead:true
    });

    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Σφάλμα ενημέρωσης μηνυμάτων' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/messages/:id
// Διαγραφή μηνύματος (μόνο ο αποστολέας)
// ─────────────────────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: 'Το μήνυμα δεν βρέθηκε' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'Δεν έχετε δικαίωμα διαγραφής αυτού του μηνύματος' });
    }

    await prisma.message.delete({ where: { id: messageId } });

    res.json({ success: true });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ error: 'Σφάλμα διαγραφής μηνύματος' });
  }
};

module.exports = {
  sendMessage,
  getMyMessages,
  getConversation,
  getUnreadCount,
  markAsRead,
  deleteMessage
};