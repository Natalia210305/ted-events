const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  
  // 1. Δημιουργία Admin [cite: 24, 25]
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

  // 2. Δημιουργία Εκδηλώσεων σε διάφορες πόλεις [cite: 163]
  const cities = ['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Λάρισα', 'Ηράκλειο'];
  
  for (const city of cities) {
    await prisma.event.create({
      data: {
        title: `Συναυλία στην ${city}`,
        description: `Μεγάλη μουσική εκδήλωση στην πόλη: ${city}`,
        eventType: 'Concert',
        venue: 'Δημοτικό Θέατρο',
        address: 'Κεντρική Πλατεία 1',
        city: city,
        startDateTime: new Date('2026-07-20T21:00:00'),
        endDateTime: new Date('2026-07-20T23:30:00'),
        capacity: 500,
        status: 'PUBLISHED',
        organizerId: admin.id,
        // Δημιουργία Κατηγορίας
        categories: {
          create: [{ name: 'Music' }]
        },
        // Δημιουργία Εισιτηρίων [cite: 133, 156]
        ticketTypes: {
          create: [
            { name: 'General', price: 20.0, quantity: 400, available: 400 },
            { name: 'VIP', price: 50.0, quantity: 100, available: 100 }
          ]
        }
      }
    });
  }
  console.log('Η βάση γέμισε επιτυχώς!');
}

main().catch(console.error).finally(() => prisma.$disconnect());