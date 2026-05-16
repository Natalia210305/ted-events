const prisma = require('../db');

// Λίστα όλων των εκδηλώσεων (δημόσια)
const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true }
        },
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

// Προβολή μιας εκδήλωσης
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, firstName: true, lastName: true }
        },
        categories: true,
        ticketTypes: true,
        photos: true,
      }
    });
    if (!event) return res.status(404).json({ error: 'Εκδήλωση δεν βρέθηκε' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

// Δημιουργία εκδήλωσης (μόνο Organizer/Admin)
const createEvent = async (req, res) => {
  try {
    const { title, description, eventType, venue, address, city, latitude, longitude, startDateTime, endDateTime, capacity, categories, ticketTypes } = req.body;

    const event = await prisma.event.create({
      data: {
        title, description, eventType,
        venue, address, city,
        latitude, longitude,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        capacity,
        organizerId: req.user.id,
        categories: {
          create: categories?.map(name => ({ name })) || []
        },
        ticketTypes: {
          create: ticketTypes?.map(t => ({
            name: t.name,
            price: t.price,
            quantity: t.quantity,
            available: t.quantity,
          })) || []
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

// Ενημέρωση εκδήλωσης
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, eventType, venue, address, city, latitude, longitude, startDateTime, endDateTime, capacity, status } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title, description, eventType,
        venue, address, city,
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

// Διαγραφή εκδήλωσης
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({ where: { id } });
    res.json({ message: 'Η εκδήλωση διαγράφηκε!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Σφάλμα server' });
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };