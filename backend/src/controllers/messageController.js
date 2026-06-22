const prisma = require('../db');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, eventId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId και content είναι υποχρεωτικά' });
    }

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

      const notificationData = {
        userId: receiverId,         
        message: notificationMessage,
        type: 'new_message',        
        isRead: false
      };

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
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { sentAt: 'desc' }
    });

    const threadsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const eventKey = msg.eventId || 'general';
      const key = `${otherUser.id}_${eventKey}`;

      if (!threadsMap.has(key)) {
        threadsMap.set(key, {
          id: key,
          otherUser,
          eventId: msg.eventId || null,
          event: msg.event || null,
          content: msg.content, 
          firstContent: msg.content, 
          sentAt: msg.sentAt,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          unreadCount: 0
        });
      } else {
        const thread = threadsMap.get(key);
        thread.firstContent = msg.content; 
      }

      const thread = threadsMap.get(key);
      if (msg.receiverId === userId && msg.readAt === null) {
        thread.unreadCount += 1;
      }
    }

    const finalThreads = Array.from(threadsMap.values()).map(thread => {
      if (thread.firstContent && thread.firstContent.includes('[ΘΕΜΑ:')) {
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

const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    const eventId = req.query.eventId && req.query.eventId !== 'null' ? req.query.eventId : null;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ],
        eventId: eventId ? eventId : null
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        receiver: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        },
        event: {
          select: { id: true, title: true }
        }
      },
      orderBy: { sentAt: 'asc' } 
    });

    res.json(messages);
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ error: 'Σφάλμα φόρτωσης συνομιλίας' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null  
      }
    });

    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Σφάλμα μέτρησης αδιάβαστων' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const senderId = req.params.userId;

    await prisma.message.updateMany({
      where: {
        senderId: senderId,
        receiverId: userId,
        readAt: null 
      },
      data: { readAt: new Date() }  
    });

    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Σφάλμα ενημέρωσης μηνυμάτων' });
  }
};

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

const getAdminId = async (req, res) => {
  try {
    // Ψάχνουμε τον πρώτο χρήστη που έχει role 'ADMIN'
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN' // Ή "Admin" ανάλογα πώς το έχεις αποθηκεύσει
      },
      select: { id: true }
    });

    if (!adminUser) {
      return res.status(404).json({ error: 'Δεν βρέθηκε διαχειριστής στο σύστημα' });
    }

    res.json({ adminId: adminUser.id });
  } catch (err) {
    console.error('getAdminId error:', err);
    res.status(500).json({ error: 'Σφάλμα κατά την εύρεση του Admin' });
  }
};

module.exports = {
  sendMessage,
  getMyMessages,
  getConversation,
  getUnreadCount,
  markAsRead,
  deleteMessage,
  getAdminId
};