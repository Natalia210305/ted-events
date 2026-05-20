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
    // 1. Console log για να δεις ΣΤΟ ΤΕΡΜΑΤΙΚΟ σου τι στέλνει το Frontend
    console.log("=== REQ.BODY RECEIVED ===", req.body);

    const { 
      title, description, eventType, venue, address, city, country, 
      latitude, longitude, startDateTime, endDateTime, capacity, categories
    } = req.body;

    // Δικλείδα ασφαλείας: Αν το frontend στέλνει 'tickets' αντί για 'ticketTypes', το πιάνουμε
    const incomingTickets = req.body.ticketTypes || req.body.tickets || [];

    // Έλεγχος capacity vs ticket quantities (μετατρέπουμε σε αριθμούς για σιγουριά)
    const parsedCapacity = parseInt(capacity) || 0;
    const totalTickets = incomingTickets.reduce((sum, t) => sum + (parseInt(t.quantity) || 0), 0);
    
    if (totalTickets > parsedCapacity) {
      return res.status(400).json({ error: 'Το άθροισμα εισιτηρίων υπερβαίνει τη χωρητικότητα' });
    }

    const event = await prisma.event.create({
      data: {
        title, 
        description, 
        eventType,
        venue, 
        address, 
        city, 
        country: country || 'Greece',
        latitude: latitude ? parseFloat(latitude) : null, 
        longitude: longitude ? parseFloat(longitude) : null,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        capacity: parsedCapacity, 
        organizerId: req.user.id,
        categories: {
          create: (categories || []).map(name => ({ name }))
        },
        ticketTypes: {
          // Διαβάζουμε από το incomingTickets που έχει σίγουρα τα δεδομένα
          create: incomingTickets.map(t => ({
            name: t.name || t.type || 'General Admission', // δικλείδα για το όνομα
            price: parseFloat(t.price) || 0,
            quantity: parseInt(t.quantity) || 0,
            available: parseInt(t.quantity) || 0,
          }))
        }
      },
      include: { categories: true, ticketTypes: true }
    });

    console.log(`✅ Το event "${event.title}" δημιουργήθηκε με ${event.ticketTypes.length} τύπους εισιτηρίων.`);
    res.status(201).json(event);

  } catch (err) {
    console.error("❌ Σφάλμα κατά τη δημιουργία εκδήλωσης:", err);
    res.status(500).json({ error: 'Σφάλμα server κατά τη δημιουργία' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. ΣΩΣΤΟ DESTRUCTURING: Παίρνουμε τα πεδία ξεχωριστά από το req.body
    const { 
      title, description, eventType, venue, address, city, country, 
      latitude, longitude, startDateTime, endDateTime, capacity 
    } = req.body;

    // 2. Βρίσκουμε την εκδήλωση με τις τρέχουσες (παλιές) τιμές ΚΑΙ τις κρατήσεις
    const oldEvent = await prisma.event.findUnique({
      where: { id: id },
      include: { bookings: true }
    });

    if (!oldEvent) return res.status(404).json({ error: 'Η εκδήλωση δεν βρέθηκε' });

    // 3. Ελέγχουμε τι ακριβώς άλλαξε για να φτιάξουμε το κατάλληλο μήνυμα
    let changeMessages = [];

    // Έλεγχος για αλλαγή ημερομηνίας/ώρας έναρξης
    if (startDateTime && new Date(startDateTime).getTime() !== new Date(oldEvent.startDateTime).getTime()) {
      changeMessages.push("την ημερομηνία/ώρα διεξαγωγής");
    }

    // Έλεγχος για αλλαγή τοποθεσίας/χώρου
    if (venue && venue !== oldEvent.venue) {
      changeMessages.push("τον χώρο διεξαγωγής (venue)");
    }

    // 4. Εκτέλεση του Update στη βάση με σωστά Datatypes
    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: {
        title,
        description,
        eventType,
        venue,
        address,
        city,
        country: country || 'Greece',
        latitude: latitude !== '' && latitude !== null ? parseFloat(latitude) : null,
        longitude: longitude !== '' && longitude !== null ? parseFloat(longitude) : null,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        capacity: parseInt(capacity)
      }
    });

    console.log(`✔ Το event "${updatedEvent.title}" ενημερώθηκε επιτυχώς στη βάση.`);
    // Ενημέρωση ticket types αν στάλθηκαν
    if (req.body.ticketTypes && req.body.ticketTypes.length > 0) {
      // Διαγραφή παλιών
      await prisma.ticketType.deleteMany({ where: { eventId: id } });
      
      // Δημιουργία νέων
      await prisma.ticketType.createMany({
        data: req.body.ticketTypes.map(t => ({
          eventId: id,
          name: t.name,
          price: parseFloat(t.price),
          quantity: parseInt(t.quantity),
          available: parseInt(t.quantity),
        }))
      });
    }
    // Ενημέρωση κατηγοριών
    if (req.body.categories && req.body.categories.length > 0) {
      await prisma.eventCategory.deleteMany({ where: { eventId: id } });
      await prisma.eventCategory.createMany({
        data: req.body.categories.map(name => ({
          eventId: id,
          name: typeof name === 'string' ? name : name.name
        }))
      });
    }
    // 5. Αν άλλαξε κάτι από τα παραπάνω ΚΑΙ υπάρχουν κρατήσεις, στέλνουμε ειδοποίηση
    if (changeMessages.length > 0 && oldEvent.bookings && oldEvent.bookings.length > 0) {
      
      const MessageText = `Ο διοργανωτής τροποποίησε ${changeMessages.join(' και ')} στην εκδήλωση "${updatedEvent.title}". Παρακαλώ ελέγξτε τις νέες πληροφορίες.`;

      const notificationsData = oldEvent.bookings.map(booking => ({
        userId: booking.attendeeId, // Αντιστοίχιση με το πεδίο userId του πίνακα Notification
        message: MessageText,
        type: 'EVENT_UPDATED',
        isRead: false
      }));

      console.log(`✅ Δημιουργήθηκαν ${notificationsData.length} ειδοποιήσεις για αλλαγή στοιχείων.`);
    }

    return res.json({ message: 'Η εκδήλωση ενημερώθηκε επιτυχώς.', updatedEvent });

  } catch (err) {
    console.error("❌ Σφάλμα κατά την ενημέρωση:", err);
    return res.status(500).json({ error: 'Σφάλμα server κατά την αποθήκευση.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // ΒΗΜΑ 1: Φέρνουμε το event ΜΑΖΙ με τις κρατήσεις (include)
    const event = await prisma.event.findUnique({
      where: { id: id },
      include: { bookings: true } 
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // ΒΗΜΑ 2: Ενημερώνουμε το status σε CANCELLED
    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: { status: 'CANCELLED' }
    });

    // ΒΗΜΑ 3: Δημιουργούμε και ΑΠΟΘΗΚΕΥΟΥΜΕ τις ειδοποιήσεις στη βάση
    if (event.bookings && event.bookings.length > 0) {
      const notificationsData = event.bookings.map(booking => ({
        userId: booking.attendeeId, // σιγουρέψου ότι ο πίνακας Notification έχει στήλη userId
        message: `Η εκδήλωση "${event.title}" ακυρώθηκε.`,
        type: 'EVENT_CANCELLED',
        isRead: false
      }));

      // ΑΥΤΗ Η ΓΡΑΜΜΗ ΕΛΕΙΠΕ ΚΑΙ ΔΕΝ ΑΠΟΘΗΚΕΥΟΝΤΑΝ:
      await prisma.notification.createMany({
        data: notificationsData
      });

      console.log(`✅ Ειδοποιήσεις στάλθηκαν σε: ${notificationsData.length} χρήστες`);
    }

    // Επιστρέφουμε JSON που περιέχει το updatedEvent για να το διαβάσει το Frontend
    res.json({ message: 'Η εκδήλωση ακυρώθηκε επιτυχώς.', updatedEvent });

  } catch (err) {
    console.error("❌ Σφάλμα κατά την ακύρωση:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Ενημερώνουμε το status της εκδήλωσης σε PUBLISHED
    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: { status: 'PUBLISHED' }
    });

    console.log(`✅ Η εκδήλωση "${updatedEvent.title}" δημοσιεύτηκε επιτυχώς!`);
    return res.json({ message: 'Η εκδήλωση δημοσιεύτηκε επιτυχώς.', updatedEvent });

  } catch (err) {
    console.error("❌ Σφάλμα κατά τη δημοσίευση:", err);
    return res.status(500).json({ error: 'Σφάλμα server κατά τη δημοσίευση.' });
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

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        attendeeId: userId 
      },
      include: {
        event: {
          select: {
            title: true,
            startDateTime: true,
            venue: true,
            city: true
          }
        },
        ticketType: {
          select: {
            name: true,
            price: true
          }
        },
        attendee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        time: "desc" // Εδώ βάλαμε 'time' γιατί έτσι το είδαμε στη φωτό σου
      }
    });

    res.json(bookings);
  } catch (err) {
    console.error("Σφάλμα στο getMyBookings:", err);
    res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση του ιστορικού' });
  }
};

const exportEventsXML = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { categories: true, ticketTypes: true, bookings: true }
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<Events>\n';
    for (const e of events) {
      xml += `  <Event EventID="${e.id}">\n`;
      xml += `    <Title>${e.title}</Title>\n`;
      for (const c of e.categories) xml += `    <Category>${c.name}</Category>\n`;
      xml += `    <EventType>${e.eventType}</EventType>\n`;
      xml += `    <Venue>${e.venue}</Venue>\n`;
      xml += `    <Address>${e.address}</Address>\n`;
      xml += `    <City>${e.city}</City>\n`;
      xml += `    <Country>${e.country}</Country>\n`;
      if (e.latitude && e.longitude) xml += `    <GeoLocation Latitude="${e.latitude}" Longitude="${e.longitude}"/>\n`;
      xml += `    <StartDateTime>${e.startDateTime.toISOString()}</StartDateTime>\n`;
      xml += `    <EndDateTime>${e.endDateTime.toISOString()}</EndDateTime>\n`;
      xml += `    <Capacity>${e.capacity}</Capacity>\n`;
      xml += `    <TicketTypes>\n`;
      for (const t of e.ticketTypes) {
        xml += `      <TicketType TicketTypeID="${t.id}">\n`;
        xml += `        <Name>${t.name}</Name>\n`;
        xml += `        <Price>${t.price}</Price>\n`;
        xml += `        <Quantity>${t.quantity}</Quantity>\n`;
        xml += `        <Available>${t.available}</Available>\n`;
        xml += `      </TicketType>\n`;
      }
      xml += `    </TicketTypes>\n`;
      xml += `    <Bookings>\n`;
      for (const b of e.bookings) {
        xml += `      <Booking BookingID="${b.id}">\n`;
        xml += `        <Attendee UserID="${b.attendeeId}"/>\n`;
        xml += `        <Time>${b.time.toISOString()}</Time>\n`;
        xml += `        <TicketTypeRef>${b.ticketTypeId}</TicketTypeRef>\n`;
        xml += `        <NumberOfTickets>${b.numberOfTickets}</NumberOfTickets>\n`;
        xml += `        <TotalCost>${b.totalCost}</TotalCost>\n`;
        xml += `        <BookingStatus>${b.status}</BookingStatus>\n`;
        xml += `      </Booking>\n`;
      }
      xml += `    </Bookings>\n`;
      xml += `    <Organizer UserID="${e.organizerId}"/>\n`;
      xml += `    <Status>${e.status}</Status>\n`;
      xml += `    <Description>${e.description}</Description>\n`;
      xml += `  </Event>\n`;
    }
    xml += '</Events>';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="events.xml"');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα export' });
  }
};

const exportEventsJSON = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { categories: true, ticketTypes: true, bookings: true }
    });
    res.setHeader('Content-Disposition', 'attachment; filename="events.json"');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Σφάλμα export' });
  }
};

module.exports = { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  publishEvent, 
  getMyEvents, 
  createBooking,
  getMyBookings, // ΠΡΟΣΘΕΣΕ ΑΥΤΟ ΕΔΩ!
  exportEventsXML,
  exportEventsJSON
};