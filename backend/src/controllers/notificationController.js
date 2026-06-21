const prisma = require('../db');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId: userId },  // ← απλά αυτό, χωρίς OR
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση ειδοποιήσεων' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'Ενημερώθηκαν όλες' });
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα update' });
  }
};

module.exports = { getNotifications, markAsRead };