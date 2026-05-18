const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getMyEvents,
  createBooking // Πρόσθεσε αυτό!
} = require('../controllers/eventController');
router.get('/', getAllEvents);
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);  
router.get('/:id', getEventById);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);
router.patch('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent);
router.post('/:id/bookings', authenticate, createBooking);

module.exports = router;