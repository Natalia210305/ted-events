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
  createBooking,
  getMyBookings 
} = require('../controllers/eventController');

// 1. Γενικά routes
router.get('/', getAllEvents);

// 2. Routes για τον Διοργανωτή (Events που δημιούργησε)
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);  

// 3. ΙΣΤΟΡΙΚΟ ΚΡΑΤΗΣΕΩΝ (Πρέπει να είναι ΠΡΙΝ το /:id)
router.get('/bookings/my', authenticate, getMyBookings); 

// 4. Δυναμικά routes με ID (Πάντα μετά από τα στατικά paths)
router.get('/:id', getEventById);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);
// Από router.patch σε router.put
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent);

// 5. Κρατήσεις
router.post('/:id/bookings', authenticate, createBooking);

module.exports = router;