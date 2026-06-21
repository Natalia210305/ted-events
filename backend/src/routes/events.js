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

router.get('/', getAllEvents);
router.post('/', authenticate, authorize('ORGANIZER', 'ADMIN'), createEvent);

router.get('/my', authenticate, authorize('ORGANIZER', 'ADMIN'), getMyEvents);  
router.get('/bookings/my', authenticate, getMyBookings); 

router.get('/organizer/bookings', authenticate, authorize('ORGANIZER', 'ADMIN'), getOrganizerBookings); 

router.get('/export/xml', authenticate, authorize('ADMIN'), exportEventsXML);
router.get('/export/json', authenticate, authorize('ADMIN'), exportEventsJSON);

router.get('/recommendations', authenticate, getRecommendations); 

router.get('/:id', getEventById);
router.put('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ORGANIZER', 'ADMIN'), deleteEvent);
router.patch('/:id/publish', authenticate, authorize('ORGANIZER', 'ADMIN'), publishEvent);
router.post('/:id/bookings', authenticate, createBooking);

module.exports = router;