require('dotenv').config(); 
const prisma = require('../src/db'); 
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
      password: 'test123',
      firstName: 'Admin',
      lastName: 'System',
      email: 'admin@tedapp.gr',
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log(`Ο χρήστης Admin δημιουργήθηκε ή υπήρχε ήδη (ID: ${admin.id})`);

  // 3. Οι επίσημες κατηγορίες από τα φίλτρα της μπάρας σου
  const categoriesToCreate = [
    'BOARD GAMES',
    'LIVE PERFORMANCE',
    'ΜΟΥΣΙΚΗ',
    'OPEN AIR',
    'RETRO',
    'SPORTS',
    'STRATEGY',
    'ΣΙΝΕΜΑ',
    'ΤΑΙΝΙΕΣ'
  ];

  console.log('Αρχικοποίηση εγκεκριμένων κατηγοριών στην οριζόντια μπάρα...');
  for (const catName of categoriesToCreate) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName }
    });
    console.log(`+ Καταχωρήθηκε η κατηγορία: ${catName}`);
  }

  console.log('Η βάση δεδομένων αρχικοποιήθηκε επιτυχώς! Δεν δημιουργήθηκε καμία εκδήλωση.');
}

main()
  .catch((error) => {
    console.error('Προέκυψε σφάλμα κατά το seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });