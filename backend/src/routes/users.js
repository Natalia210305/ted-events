const express = require('express');
const router = express.Router();
const { getAllUsers, approveUser, rejectUser, getUserById } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Μόνο Admin
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/:id/approve', authenticate, authorize('ADMIN'), approveUser);
router.patch('/:id/reject', authenticate, authorize('ADMIN'), rejectUser);

// Οποιοσδήποτε συνδεδεμένος
router.get('/:id', authenticate, getUserById);

module.exports = router;