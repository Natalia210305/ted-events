const express = require('express');
const router = express.Router();
const { sendMessage, getMyMessages, getConversation } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, sendMessage);
router.get('/my', authenticate, getMyMessages);
router.get('/conversation/:userId', authenticate, getConversation);

module.exports = router;