const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  publishEvent, 
  getMyEvents, 
  createBooking, 
  getMyBookings,
  getOrganizerBookings, 
  getRecommendations    
} = require('../controllers/eventController');
const { exportEventsXML, exportEventsJSON } = require('../controllers/eventController');

// 1. Ρούτες Συλλογών (Σκέτο /)
router.get('/', getAllEvents);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);

// 2. Στατικά Routes (Χωρίς παραμέτρους :id)
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);  
router.get('/bookings/my', authenticate, getMyBookings); 

// <-- 2. ΠΡΟΣΘΗΚΗ: Η νέα ρούτα για το Ιστορικό Πωλήσεων του Διοργανωτή (Απαίτηση 7β)
router.get('/organizer/bookings', authenticate, authorize('ORGANIZER', 'ADMIN'), getOrganizerBookings); 

router.get('/export/xml', authenticate, authorize('ADMIN'), exportEventsXML);
router.get('/export/json', authenticate, authorize('ADMIN'), exportEventsJSON);

// <-- 3. ΔΙΟΡΘΩΣΗ: Προσθήκη authenticate για να ξέρει ο αλγόριθμος Matrix Factorization ποιος χρήστης ζητάει τις συστάσεις! (Απαίτηση 13)
router.get('/recommendations', authenticate, getRecommendations); 

// 3. Δυναμικά Routes με ID (Μπαίνουν ΠΑΝΤΑ τελευταία στο αρχείο!)
router.get('/:id', getEventById);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);
router.patch('/:id/publish', authenticate, authorize('ORGANIZER', 'ADMIN'), publishEvent);
router.post('/:id/bookings', authenticate, createBooking);

module.exports = router;