require('dotenv').config();
const prisma = require('./src/db');

async function deleteUsers() {
  const usernames = ['natalia', 'victoria', 'user', 'victoriakoulakou']; 

  for (const username of usernames) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) { console.log(`Δεν βρέθηκε: ${username}`); continue; }

    const events = await prisma.event.findMany({ where: { organizerId: user.id } });
    for (const event of events) {
      await prisma.booking.deleteMany({ where: { eventId: event.id } });
    }
    await prisma.event.deleteMany({ where: { organizerId: user.id } });
    await prisma.booking.deleteMany({ where: { attendeeId: user.id } });
    await prisma.message.deleteMany({ where: { senderId: user.id } });
    await prisma.message.deleteMany({ where: { receiverId: user.id } });
    await prisma.user.delete({ where: { username } });
    
    console.log(`Διαγράφηκε: ${username}`);
  }

  await prisma.$disconnect();
}

deleteUsers().catch((err) => { console.error(err); prisma.$disconnect(); });