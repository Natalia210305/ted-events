const prisma = require('../db');

// Λίστα όλων των χρηστών (μόνο Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    // Πιάνουμε ΟΛΑ τα πεδία που στέλνει η React φόρμα
    const { firstName, lastName, email, phone, address, city, country, afm } = req.body;

    // Ενημέρωση στη βάση δεδομένων
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        country,
        afm
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        afm: true,
        role: true
      }
    });

    return res.json({ message: 'Το προφίλ ενημερώθηκε με επιτυχία', user: updatedUser });
  } catch (err) {
    console.error("❌ Σφάλμα κατά το update του προφίλ:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Αυτό το email χρησιμοποιείται ήδη από άλλον χρήστη.' });
    }
    return res.status(500).json({ error: 'Σφάλμα κατά την ενημέρωση του προφίλ στη βάση δεδομένων.' });
  }
};

// Έγκριση χρήστη (μόνο Admin)
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { status: 'APPROVED' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      }
    });
    res.json({ message: 'Ο χρήστης εγκρίθηκε!', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      }
    });
    res.json({ message: 'Ο χρήστης απορρίφθηκε!', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Προβολή προφίλ χρήστη
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        afm: true,      // <--- ΒΕΒΑΙΩΣΟΥ ΟΤΙ ΥΠΑΡΧΕΙ ΑΥΤΟ!
        role: true,
        status: true,
        createdAt: true,
      }
    });
    if (!user) return res.status(404).json({ error: 'Χρήστης δεν βρέθηκε' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { getAllUsers, approveUser, rejectUser, getUserById, updateProfile };