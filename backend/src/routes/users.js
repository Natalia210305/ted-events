const express = require('express');
const router = express.Router();
const { updateProfile, getAllUsers, approveUser, rejectUser, getUserById } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// 1. Μόνο Admin Routes
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/:id/approve', authenticate, authorize('ADMIN'), approveUser);
router.patch('/:id/reject', authenticate, authorize('ADMIN'), rejectUser);

// 2. Οποιοσδήποτε συνδεδεμένος χρήστης (Διαχείριση δικού του Προφίλ)
// ΠΡΕΠΕΙ να μπει ΠΡΙΝ το /:id για να μην μπερδεύεται ο Express
router.put('/profile', authenticate, updateProfile);

// 3. Routes με δυναμικό ID (Πάντα στο τέλος!)
router.get('/:id', authenticate, getUserById);

module.exports = router;