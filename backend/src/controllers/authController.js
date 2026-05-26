const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, email, phone, address, city, country, afm, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Το username χρησιμοποιείται ήδη' }); // [cite: 22]
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Το email χρησιμοποιείται ήδη' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username, password: hashed,
        firstName, lastName, email,
        phone, address, city, country, afm, // [cite: 21]
        role: role === 'ORGANIZER' ? 'ORGANIZER' : 'ATTENDEE',  // ← μόνο αυτοί οι 2 ρόλοι [cite: 13]
        status: 'PENDING' // 
      }
    });

    // 🎯 ΝΕΟ: Αυτόματη Ειδοποίηση στον Admin για τη νέα αίτηση εγγραφής [cite: 30, 173]
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (adminUser) {
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            content: `Νέα αίτηση εγγραφής: ${firstName} ${lastName} (${role}). Εκκρεμεί έγκριση.`,
            isRead: false
          }
        });
      }
    } catch (notifError) {
      console.error('Σφάλμα δημιουργίας ειδοποίησης Admin:', notifError);
    }

    res.status(201).json({ message: 'Εγγραφή επιτυχής! Αναμένετε έγκριση από τον διαχειριστή.' }); // 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body; // [cite: 19]

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: 'Λάθος username ή password' });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({ error: 'Η αίτησή σας αναμένει έγκριση' }); // 
    }

    if (user.status === 'REJECTED') {
      return res.status(403).json({ error: 'Η αίτησή σας απορρίφθηκε' }); // [cite: 30]
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Λάθος username ή password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // [cite: 202]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    }); // [cite: 31]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { register, login };