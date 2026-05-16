const prisma = require('../db');

// Αποστολή μηνύματος
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

// Λίστα μηνυμάτων χρήστη
const getMyMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { sentAt: 'desc' }
    });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Συνομιλία με συγκεκριμένο χρήστη
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { sentAt: 'asc' }
    });

    // Σήμανση ως αναγνωσμένα
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        readAt: null
      },
      data: { readAt: new Date() }
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { sendMessage, getMyMessages, getConversation };