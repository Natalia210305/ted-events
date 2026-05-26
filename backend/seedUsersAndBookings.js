require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./src/db');

async function seedUsers() {
    console.log("👥 Δημιουργία χρηστών...");

    const hashedPassword = await bcrypt.hash('password123', 10);

    const organizers = [
        { username: 'organizer1', firstName: 'Νίκος', lastName: 'Παπαδόπουλος', email: 'nikos@example.com' },
        { username: 'organizer2', firstName: 'Μαρία', lastName: 'Γεωργίου', email: 'maria@example.com' },
        { username: 'organizer3', firstName: 'Κώστας', lastName: 'Αντωνίου', email: 'kostas@example.com' },
    ];

    const attendees = [
        { username: 'attendee1', firstName: 'Ελένη', lastName: 'Δημητρίου', email: 'eleni@example.com' },
        { username: 'attendee2', firstName: 'Γιώργης', lastName: 'Παναγιώτου', email: 'giorgis@example.com' },
        { username: 'attendee3', firstName: 'Σοφία', lastName: 'Κωνσταντίνου', email: 'sofia@example.com' },
        { username: 'attendee4', firstName: 'Δημήτρης', lastName: 'Νικολάου', email: 'dimitris@example.com' },
        { username: 'attendee5', firstName: 'Άννα', lastName: 'Στεφάνου', email: 'anna@example.com' },
    ];

    const createdOrganizers = [];
    const createdAttendees = [];

    // Δημιουργία organizers
    for (const org of organizers) {
        const user = await prisma.user.upsert({
            where: { username: org.username },
            update: {},
            create: {
                ...org,
                password: hashedPassword,
                role: 'ORGANIZER',
                status: 'APPROVED',
                phone: '6900000000',
                address: 'Αθήνα',
                city: 'Αθήνα',
                country: 'Ελλάδα',
            }
        });
        createdOrganizers.push(user);
        console.log(`✓ Organizer: ${user.username}`);
    }

    // Δημιουργία attendees
    for (const att of attendees) {
        const user = await prisma.user.upsert({
            where: { username: att.username },
            update: {},
            create: {
                ...att,
                password: hashedPassword,
                role: 'ATTENDEE',
                status: 'APPROVED',
                phone: '6900000000',
                address: 'Αθήνα',
                city: 'Αθήνα',
                country: 'Ελλάδα',
            }
        });
        createdAttendees.push(user);
        console.log(`✓ Attendee: ${user.username}`);
    }

    return { createdOrganizers, createdAttendees };
}

async function reassignEvents(organizers) {
    console.log("\n🎯 Ανακατανομή εκδηλώσεων σε διαφορετικούς organizers...");

    const events = await prisma.event.findMany({
        select: { id: true, title: true }
    });

    for (let i = 0; i < events.length; i++) {
        // Κάθε organizer παίρνει ~5 εκδηλώσεις
        const organizer = organizers[i % organizers.length];
        await prisma.event.update({
            where: { id: events[i].id },
            data: { organizerId: organizer.id }
        });
        console.log(`✓ "${events[i].title}" → ${organizer.username}`);
    }
}

async function seedBookingsAndViews(attendees) {
    console.log("\n🎟️  Δημιουργία κρατήσεων και επισκέψεων...");

    const events = await prisma.event.findMany({
        include: { ticketTypes: true }
    });

    // Κάθε attendee κάνει κράτηση σε 3-5 τυχαίες εκδηλώσεις
    for (const attendee of attendees) {
        // Τυχαία επιλογή εκδηλώσεων για κράτηση
        const shuffled = [...events].sort(() => Math.random() - 0.5);
        const toBook = shuffled.slice(0, Math.floor(Math.random() * 3) + 3); // 3-5 εκδηλώσεις

        for (const event of toBook) {
            if (!event.ticketTypes.length) continue;
            const ticketType = event.ticketTypes[0];

            // Έλεγξε αν υπάρχει ήδη κράτηση
            const existing = await prisma.booking.findFirst({
                where: { attendeeId: attendee.id, eventId: event.id }
            });
            if (existing) continue;

            // Έλεγξε διαθεσιμότητα
            if (ticketType.available < 1) continue;

            await prisma.booking.create({
                data: {
                    attendeeId: attendee.id,
                    eventId: event.id,
                    ticketTypeId: ticketType.id,
                    numberOfTickets: 1,
                    totalCost: ticketType.price,
                    status: 'CONFIRMED',
                }
            });

            // Μείωσε διαθέσιμα εισιτήρια
            await prisma.ticketType.update({
                where: { id: ticketType.id },
                data: { available: { decrement: 1 } }
            });

            console.log(`✓ Κράτηση: ${attendee.username} → "${event.title}"`);
        }

        // Επισκέψεις σε επιπλέον εκδηλώσεις (χωρίς κράτηση)
        const toView = shuffled.slice(5, 8); // 3 επιπλέον εκδηλώσεις
        for (const event of toView) {
            const existing = await prisma.eventView.findFirst({
                where: { userId: attendee.id, eventId: event.id }
            });
            if (existing) continue;

            await prisma.eventView.create({
                data: { userId: attendee.id, eventId: event.id }
            });
            console.log(`👁  View: ${attendee.username} → "${event.title}"`);
        }
    }
}

async function main() {
    const { createdOrganizers, createdAttendees } = await seedUsers();
    await reassignEvents(createdOrganizers);
    await seedBookingsAndViews(createdAttendees);

    console.log(`
✅ Ολοκληρώθηκε!
   - ${createdOrganizers.length} organizers
   - ${createdAttendees.length} attendees
   
🔑 Όλοι οι χρήστες έχουν password: password123
`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });