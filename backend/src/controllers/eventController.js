const prisma = require('../db');

const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        categories: true,
        ticketTypes: true,
      }
    });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        categories: true,
        ticketTypes: true,
        photos: true,
      }
    });
    if (!event) return res.status(404).json({ error: 'Εκδήλωση δεν βρέθηκε' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const createEvent = async (req, res) => {
  try {
    const { title, description, eventType, venue, address, city, country, latitude, longitude, startDateTime, endDateTime, capacity, categories, ticketTypes } = req.body;

    // Έλεγχος capacity vs ticket quantities
    const totalTickets = (ticketTypes || []).reduce((sum, t) => sum + t.quantity, 0);
    if (totalTickets > capacity) {
      return res.status(400).json({ error: 'Το άθροισμα εισιτηρίων υπερβαίνει τη χωρητικότητα' });
    }

    const event = await prisma.event.create({
      data: {
        title, description, eventType,
        venue, address, city, country: country || 'Greece',
        latitude, longitude,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        capacity,
        organizerId: req.user.id,
        categories: {
          create: (categories || []).map(name => ({ name }))
        },
        ticketTypes: {
          create: (ticketTypes || []).map(t => ({
            name: t.name,
            price: parseFloat(t.price),
            quantity: parseInt(t.quantity),
            available: parseInt(t.quantity),
          }))
        }
      },
      include: { categories: true, ticketTypes: true }
    });

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, eventType, venue, address, city, country, latitude, longitude, startDateTime, endDateTime, capacity, status } = req.body;

    // Αν ακυρώνεται, ενημέρωσε και τις κρατήσεις
    if (status === 'CANCELLED') {
      await prisma.booking.updateMany({
        where: { eventId: id, status: 'CONFIRMED' },
        data: { status: 'CANCELLED' }
      });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title, description, eventType,
        venue, address, city, country,
        latitude, longitude,
        startDateTime: startDateTime ? new Date(startDateTime) : undefined,
        endDateTime: endDateTime ? new Date(endDateTime) : undefined,
        capacity, status
      }
    });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { bookings: true }
    });

    if (!event) return res.status(404).json({ error: 'Εκδήλωση δεν βρέθηκε' });

    if (event.status === 'PUBLISHED' && event.bookings.length > 0) {
      return res.status(400).json({ error: 'Δεν μπορείτε να διαγράψετε εκδήλωση με κρατήσεις' });
    }

    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Η εκδήλωση διαγράφηκε!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Εκδηλώσεις διοργανωτή
const getMyEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      include: {
        categories: true,
        ticketTypes: true,
        bookings: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};
const createBooking = async (req, res) => {
  console.log("--- ΝΕΑ ΠΡΟΣΠΑΘΕΙΑ ΚΡΑΤΗΣΗΣ ---");
  try {
    const { id } = req.params;
    const { ticketTypeId, numberOfTickets, totalCost } = req.body;
    const userId = req.user.id;

    console.log(`Event ID: ${id}, TicketType ID: ${ticketTypeId}, User: ${userId}`);

    // 1. Έλεγχος διαθεσιμότητας
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId }
    });

    if (!ticketType) {
      console.log("Σφάλμα: Ο τύπος εισιτηρίου δεν βρέθηκε.");
      return res.status(404).json({ message: 'Ο τύπος εισιτηρίου δεν υπάρχει.' });
    }

    if (ticketType.available < numberOfTickets) {
      console.log("Σφάλμα: Ανεπαρκή εισιτήρια.");
      return res.status(400).json({ message: 'Δεν υπάρχουν αρκετά διαθέσιμα εισιτήρια.' });
    }

    // 2. Εκτέλεση Transaction στο Supabase
    const result = await prisma.$transaction([
      prisma.booking.create({
        data: {
          event: { connect: { id: id } },
          // ΑΛΛΑΓΗ ΕΔΩ: από user σε attendee
          attendee: { connect: { id: userId } }, 
          ticketType: { connect: { id: ticketTypeId } },
          numberOfTickets: parseInt(numberOfTickets),
          totalCost: parseFloat(totalCost),
          status: "CONFIRMED",
        }
      }),
      prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: {
          available: { decrement: parseInt(numberOfTickets) }
        }
      })
    ]);

    console.log("✅ Η κράτηση αποθηκεύτηκε στο Supabase!");
    res.status(201).json({ message: 'Επιτυχία!', booking: result[0] });

  } catch (err) {
    console.error("❌ ΣΦΑΛΜΑ PRISMA/SUPABASE:", err.message);
    res.status(500).json({ message: 'Σφάλμα βάσης δεδομένων: ' + err.message });
  }
};

module.exports = { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getMyEvents, 
  createBooking // ΠΡΟΣΘΕΣΕ ΑΥΤΟ
};