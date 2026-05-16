const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, cancelBooking } = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createBooking);
router.get('/my', authenticate, getUserBookings);
router.patch('/:id/cancel', authenticate, cancelBooking);

module.exports = router;