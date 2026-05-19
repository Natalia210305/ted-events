const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, publishEvent, getMyEvents, createBooking, getMyBookings } = require('../controllers/eventController');

// 1. Ρούτες Συλλογών (Σκέτο /) - ΠΑΝΤΑ ΠΡΩΤΑ
router.get('/', getAllEvents);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);

// 2. Στατικά Routes για τον Διοργανωτή
router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);  

// 3. Ιστορικό Κρατήσεων Χρήστη (Στατικό path, πριν από το :id)
router.get('/bookings/my', authenticate, getMyBookings); 

// 4. Δυναμικά Routes με ID (Πάντα στο τέλος του αρχείου!)
router.get('/:id', getEventById);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
// Επιτρέπουμε και στον ORGANIZER να κάνει delete (ακύρωση)
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);
// 5. Ειδικές ενέργειες πάνω σε συγκεκριμένο Event (Δημοσίευση & Κρατήσεις)
router.patch('/:id/publish', authenticate, authorize('ORGANIZER', 'ADMIN'), publishEvent);
router.post('/:id/bookings', authenticate, createBooking);

module.exports = router;