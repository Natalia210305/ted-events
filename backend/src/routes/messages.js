const express = require('express');
const router = express.Router();
const { sendMessage, getMyMessages, getConversation, deleteMessage, getUnreadCount, markAsRead, getAdminId } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// Πρόσθεσε τη διαδρομή (κατά προτίμηση πριν από routes με παραμέτρους όπως το /:id)
router.get('/admin-id', authenticate, getAdminId);

router.post('/', authenticate, sendMessage);
router.get('/my', authenticate, getMyMessages);
router.get('/conversation/:userId', authenticate, getConversation);
router.get('/unread-count', authenticate, getUnreadCount);
router.delete('/:id', authenticate, deleteMessage);

router.put('/read/:userId', authenticate, markAsRead);

module.exports = router;