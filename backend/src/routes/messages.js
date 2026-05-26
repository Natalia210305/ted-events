const express = require('express');
const router = express.Router();
const { sendMessage, getMyMessages, getConversation, deleteMessage, getUnreadCount, markAsRead } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, sendMessage);
router.get('/my', authenticate, getMyMessages);
router.get('/conversation/:userId', authenticate, getConversation);
router.get('/unread-count', authenticate, getUnreadCount);
router.delete('/:id', authenticate, deleteMessage);

// 🎯 ΔΙΟΡΘΩΘΗΚΕ: Χρησιμοποιούμε το "authenticate" που έχεις ήδη ορίσει στην κορυφή!
router.put('/read/:userId', authenticate, markAsRead);

module.exports = router;