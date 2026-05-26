const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Έναρξη αρχικοποίησης της βάσης δεδομένων...');

  // 1. Παραγωγή κρυπτογραφημένου κωδικού για τον Admin
  const hashed = await bcrypt.hash('admin123', 10);
  
  // 2. Δημιουργία ή Ενημέρωση (Upsert) του Admin χρήστη
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashed,
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@tedapp.gr',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log(`Ο χρήστης Admin δημιουργήθηκε ή υπήρχε ήδη (ID: ${admin.id})`);

  // 3. Δημιουργία Εκδηλώσεων σε διάφορες πόλεις
  const cities = ['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Λάρισα', 'Ηράκλειο'];
  
  console.log('Δημιουργία αρχικών εκδηλώσεων...');
  for (const city of cities) {
    await prisma.event.create({
      data: {
        title: `Συναυλία στην ${city}`,
        description: `Μεγάλη μουσική εκδήλωση στην πόλη: ${city}. Ελάτε να απολαύσετε μια μοναδική βραδιά γεμάτη live performances και αγαπημένα τραγούδια κάτω από τα αστέρια.`,
        eventType: 'Concert',
        venue: 'Δημοτικό Θέατρο',
        address: 'Κεντρική Πλατεία 1',
        city: city,
        country: 'Greece', // Κουμπώνει 1:1 με το schema σου
        startDateTime: new Date('2026-07-20T21:00:00Z'),
        endDateTime: new Date('2026-07-20T23:30:00Z'),
        capacity: 500,
        status: 'PUBLISHED',
        organizerId: admin.id,
        
        // Σωστή δημιουργία κατηγορίας βάσει του model EventCategory
        categories: {
          create: [
            { name: 'Music' }
          ]
        },
        
        // Σωστή δημιουργία τύπων εισιτηρίων βάσει του model TicketType
        ticketTypes: {
          create: [
            { name: 'General Admission', price: 20.0, quantity: 400, available: 400 },
            { name: 'VIP Access', price: 50.0, quantity: 100, available: 100 }
          ]
        }
      }
    });
    console.log(`+ Δημιουργήθηκε η εκδήλωση: Συναυλία στην ${city}`);
  }

  console.log('Η βάση γέμισε επιτυχώς με όλα τα απαραίτητα δεδομένα!');
}

main()
  .catch((error) => {
    console.error('Προέκυψε σφάλμα κατά το seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Αποσύνδεση από τον Prisma Client για να μην μένει ανοιχτό το process
    await prisma.$disconnect();
  });