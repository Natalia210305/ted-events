const prisma = require('../db');

// Δημιουργία κράτησης
const createBooking = async (req, res) => {
  try {
    const { eventId, ticketTypeId, numberOfTickets } = req.body;

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: ticketTypeId }
    });

    if (!ticketType) {
      return res.status(404).json({ error: 'Τύπος εισιτηρίου δεν βρέθηκε' });
    }

    if (ticketType.available < numberOfTickets) {
      return res.status(400).json({ error: 'Δεν υπάρχουν αρκετά διαθέσιμα εισιτήρια' });
    }

    const totalCost = ticketType.price * numberOfTickets;

    const booking = await prisma.booking.create({
      data: {
        attendeeId: req.user.id,
        eventId,
        ticketTypeId,
        numberOfTickets,
        totalCost,
        status: 'CONFIRMED'
      }
    });

    await prisma.ticketType.update({
      where: { id: ticketTypeId },
      data: { available: ticketType.available - numberOfTickets }
    });

    // ← ΝΕΟΣ ΚΩΔΙΚΑΣ: Δημιουργία notification για τον organizer
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, organizerId: true }
    });

    if (event?.organizerId) {
      await prisma.notification.create({
        data: {
          userId: event.organizerId,
          type: 'new_booking',
          message: `Νέα κράτηση για την εκδήλωση "${event.title}" από τον χρήστη ${req.user.username || req.user.email} (x${numberOfTickets} εισιτήρια, σύνολο: €${totalCost.toFixed(2)})`,
          eventId: eventId,
          isRead: false
        }
      });
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Λίστα κρατήσεων χρήστη
const getUserBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { attendeeId: req.user.id },
      include: {
        event: {
          select: { id: true, title: true, startDateTime: true, venue: true, city: true }
        },
        ticketType: {
          select: { name: true, price: true }
        }
      }
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Ακύρωση κράτησης
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Κράτηση δεν βρέθηκε' });
    }

    if (booking.attendeeId !== req.user.id) {
      return res.status(403).json({ error: 'Δεν έχετε δικαίωμα' });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Επιστροφή εισιτηρίων
    await prisma.ticketType.update({
      where: { id: booking.ticketTypeId },
      data: { available: { increment: booking.numberOfTickets } }
    });

    res.json({ message: 'Η κράτηση ακυρώθηκε!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { createBooking, getUserBookings, cancelBooking };