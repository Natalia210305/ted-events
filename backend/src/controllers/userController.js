const prisma = require('../db');
const bcrypt = require('bcrypt'); // <-- ΠΡΟΣΘΗΚΗ: Απαραίτητο για το hashing των κωδικών

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

// Ενημέρωση Στοιχείων Προφίλ (Με αυτόματη ειδοποίηση στον Admin)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { firstName, lastName, email, phone, address, city, country, afm } = req.body;

    // 1. Τραβάμε τα παλιά στοιχεία του χρήστη για να δούμε τι είχε πριν
    const oldUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!oldUser) {
      return res.status(404).json({ error: 'Ο χρήστης δεν βρέθηκε.' });
    }

    // Έλεγχος αν άλλαξε Email, ΑΦΜ ή Τηλέφωνο
    let hasChanges = false;
    if (oldUser.email !== email || oldUser.afm !== afm || oldUser.phone !== phone) {
      hasChanges = true;
    }

    // 2. Ενημέρωση στη βάση δεδομένων
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email, phone, address, city, country, afm },
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
        role: true,
        status: true
      }
    });

    // 3. 🎯 ΔΗΜΙΟΥΡΓΙΑ ΕΙΔΟΠΟΙΗΣΗΣ (Εδώ κρύβεται όλη η μαγεία που έλειπε!)
    if (hasChanges) {
      try {
        // Βρίσκουμε τον Admin του συστήματος
        const adminUser = await prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });

        if (adminUser) {
          await prisma.notification.create({
            data: {
              userId: adminUser.id, // Ο Admin είναι ο λήπτης
              message: `ℹ️ Τροποποίηση προφίλ: Ο χρήστης ${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.username}) άλλαξε τα στοιχεία του (Email/ΑΦΜ/Τηλέφωνο).`,
              isRead: false,
              // 🎯 ΕΔΩ ΚΡΥΒΟΥΜΕ ΤΟ ID ΤΟΥ ΧΡΗΣΤΗ ΓΙΑ ΤΟ MODAL ΤΟΥ FRONTEND:
              type: updatedUser.id 
            }
          });
          console.log("✅ Η ειδοποίηση γράφτηκε επιτυχώς στο Supabase με Type (User ID):", updatedUser.id);
        }
      } catch (notifErr) {
        console.error("❌ Σφάλμα κατά τη δημιουργία ειδοποίησης επανελέγχου:", notifErr);
      }
    }

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

// Απόρριψη χρήστη (μόνο Admin)
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
        afm: true,
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

// 🔒 ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Αλλαγή Κωδικού με Έλεγχο και Αποθήκευση στην PostgreSQL
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Έρχεται αυτόματα από το auth middleware σου
    const { currentPassword, newPassword } = req.body;

    // 1. Τραβάμε τον τρέχοντα χρήστη από τη βάση για να πάρουμε τον κρυπτογραφημένο κωδικό του
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Ο χρήστης δεν βρέθηκε.' });
    }

    // 2. Έλεγχος αν ο τρέχων κωδικός που έδωσε ταιριάζει με αυτόν της βάσης
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Ο τρέχων κωδικός πρόσβασης είναι λανθασμένος!' });
    }

    // 3. Παραγωγή νέου salt και κρυπτογράφηση του καινούργιου κωδικού
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Αποθήκευση του νέου κωδικού στην PostgreSQL μέσω Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.json({ message: 'Ο κωδικός πρόσβασης ενημερώθηκε επιτυχώς στη βάση!' });
  } catch (err) {
    console.error("❌ Σφάλμα κατά την αλλαγή κωδικού:", err);
    return res.status(500).json({ error: 'Σφάλμα κατά την αλλαγή του κωδικού πρόσβασης στο backend.' });
  }
};

// Κάνουμε export και τη νέα συνάρτηση μαζί με τις υπόλοιπες
module.exports = { getAllUsers, approveUser, rejectUser, getUserById, updateProfile, changePassword };