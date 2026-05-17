const express = require('express');
const router = express.Router();
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, getMyEvents } = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', getAllEvents);
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);
router.get('/:id', authenticate, getEventById);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);
router.patch('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent);

module.exports = router;