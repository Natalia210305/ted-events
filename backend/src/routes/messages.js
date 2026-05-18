const express = require('express');
const router = express.Router();
const { sendMessage, getMyMessages, getConversation, deleteMessage } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, sendMessage);
router.get('/my', authenticate, getMyMessages);
router.get('/conversation/:userId', authenticate, getConversation);
router.delete('/:id', authenticate, deleteMessage);
module.exports = router;