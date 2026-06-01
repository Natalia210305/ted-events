const prisma = require('../db');
const { getRecommendationsForUser } = require('../services/recommendationService');

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
    console.log("=== REQ.BODY RECEIVED ===", req.body);

    const { 
      title, description, eventType, venue, address, city, country, 
      latitude, longitude, startDateTime, endDateTime, capacity, categories
    } = req.body;

    const incomingTickets = req.body.ticketTypes || req.body.tickets || [];

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
          create: incomingTickets.map(t => ({
            name: t.name || t.type || 'General Admission',
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
    
    const { 
      title, description, eventType, venue, address, city, country, 
      latitude, longitude, startDateTime, endDateTime, capacity
    } = req.body;

    const oldEvent = await prisma.event.findUnique({
      where: { id: id },
      include: { bookings: true }
    });

    if (!oldEvent) return res.status(404).json({ error: 'Η εκδήλωση δεν βρέθηκε' });

    if (oldEvent.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Δεν έχετε δικαίωμα να τροποποιήσετε αυτή την εκδήλωση' });
    }

    let changeMessages = [];

    if (startDateTime && new Date(startDateTime).getTime() !== new Date(oldEvent.startDateTime).getTime()) {
      changeMessages.push("την ημερομηνία/ώρα διεξαγωγής");
    }

    if (venue && venue !== oldEvent.venue) {
      changeMessages.push("τον χώρο διεξαγωγής (venue)");
    }

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

    if (req.body.ticketTypes && req.body.ticketTypes.length > 0) {
      const eventId = updatedEvent.id; // Ή req.params.id ανάλογα πώς το έχεις ορίσει

      // Δημιουργούμε ένα array από promises για να εκτελεστούν παράλληλα και με ασφάλεια
      const ticketOperations = req.body.ticketTypes.map(ticket => {
        // Αν το εισιτήριο έχει ID, κάνουμε update αντί για delete
        if (ticket.id) {
          return prisma.ticketType.update({
            where: { id: ticket.id },
            data: {
              name: ticket.name,
              price: parseFloat(ticket.price),
              quantity: parseInt(ticket.quantity, 10),
              // Εδώ αν θες ενημερώνεις και το Available σύμφωνα με τις τρέχουσες κρατήσεις
            }
          });
        } else {
          // Αν ΔΕΝ έχει ID, σημαίνει ότι ο διοργανωτής πρόσθεσε έναν νέο τύπο εισιτηρίου τώρα
          return prisma.ticketType.create({
            data: {
              eventId: eventId,
              name: ticket.name,
              price: parseFloat(ticket.price),
              quantity: parseInt(ticket.quantity, 10),
              available: parseInt(ticket.quantity, 10) // Αρχικά όλα είναι διαθέσιμα
            }
          });
        }
      });

      // Εκτέλεση όλων των operations μαζί με ασφάλεια
      await prisma.$transaction(ticketOperations);
      console.log(`✔ Οι τύποι εισιτηρίων για το event "${updatedEvent.title}" ενημερώθηκαν με ασφάλεια.`);
    }

    if (req.body.categories && req.body.categories.length > 0) {
      await prisma.eventCategory.deleteMany({ where: { eventId: id } });
      await prisma.eventCategory.createMany({
        data: req.body.categories.map(name => ({
          eventId: id,
          name: typeof name === 'string' ? name : name.name
        }))
      });
    }

    // ΔΙΟΡΘΩΣΗ: Προσθήκη await prisma.notification.createMany για να αποθηκεύονται οι ειδοποιήσεις αλλαγής!
    if (changeMessages.length > 0 && oldEvent.bookings && oldEvent.bookings.length > 0) {
      const MessageText = `Ο διοργανωτής τροποποίησε ${changeMessages.join(' και ')} στην εκδήλωση "${updatedEvent.title}". Παρακαλώ ελέγξτε τις νέες πληροφορίες.`;

      const notificationsData = oldEvent.bookings.map(booking => ({
        userId: booking.attendeeId, 
        message: MessageText,
        type: 'EVENT_UPDATED',
        isRead: false
      }));

      await prisma.notification.createMany({
        data: notificationsData
      });

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

    const event = await prisma.event.findUnique({
      where: { id: id },
      include: { bookings: true } 
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const updatedEvent = await prisma.event.update({
      where: { id: id },
      data: { status: 'CANCELLED' }
    });

    if (event.bookings && event.bookings.length > 0) {
      const notificationsData = event.bookings.map(booking => ({
        userId: booking.attendeeId, 
        message: `Η εκδήλωση "${event.title}" ακυρώθηκε.`,
        type: 'EVENT_CANCELLED',
        isRead: false
      }));

      await prisma.notification.createMany({
        data: notificationsData
      });

      console.log(`✅ Ειδοποιήσεις στάλθηκαν σε: ${notificationsData.length} χρήστες`);
    }

    res.json({ message: 'Η εκδήλωση ακυρώθηκε επιτυχώς.', updatedEvent });

  } catch (err) {
    console.error("❌ Σφάλμα κατά την ακύρωση:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;

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

    const result = await prisma.$transaction([
      prisma.booking.create({
        data: {
          event: { connect: { id: id } },
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
    // Δημιουργία notification για τον organizer
    const event = await prisma.event.findUnique({
      where: { id: id },
      select: { title: true, organizerId: true }
    });

    if (event?.organizerId) {
      await prisma.notification.create({
        data: {
          userId: event.organizerId,
          type: 'new_booking',
          message: `Νέα κράτηση για την εκδήλωση "${event.title}" από χρήστη (x${numberOfTickets} εισιτήρια, σύνολο: €${parseFloat(totalCost).toFixed(2)})`,
          isRead: false
        }
      });
      console.log("✅ Notification δημιουργήθηκε για organizer:", event.organizerId);
    }

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
      where: { attendeeId: userId },
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
        time: "desc"
      }
    });

    res.json(bookings);
  } catch (err) {
    console.error("Σφάλμα στο getMyBookings:", err);
    res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση του ιστορικού' });
  }
};

const getOrganizerBookings = async (req, res) => {
  try {
    const organizerId = req.user.id; // Το ID του συνδεδεμένου διοργανωτή από το Auth Middleware

    const bookings = await prisma.booking.findMany({
      where: {
        event: {
          organizerId: organizerId // Φιλτράρουμε τις κρατήσεις για τα events αυτού του διοργανωτή
        }
      },
      include: {
        event: {
          select: { title: true }
        },
        attendee: {
          select: { username: true, email: true } // Για να ξέρει ο διοργανωτής ποιος αγόρασε
        },
        ticketType: {
          select: { name: true }
        }
      },
      orderBy: {
        time: 'desc' // Οι πιο πρόσφατες αγορές εμφανίζονται πρώτες
      }
    });

    res.json(bookings);
  } catch (err) {
    console.error("❌ Σφάλμα στο getOrganizerBookings:", err);
    res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των κρατήσεων του διοργανωτή' });
  }
};

const exportEventsXML = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { categories: true, ticketTypes: true, bookings: true }
    });

    // ΕΔΩ ΕΓΙΝΕ Η ΑΛΛΑΓΗ: Προστέθηκε η γραμμή του DOCTYPE αμέσως μετά την πρώτη γραμμή του XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE Events SYSTEM "events.dtd">\n<Events>\n';
    
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

const getRecommendations = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ error: 'Required userId query param' });
        
        // 1. Διαβάζουμε με ασφάλεια τα Interactions (αν δεν υπάρχει ο πίνακας, επιστρέφει άδειο array)
        let allInteractions = [];
        try {
            if (prisma.eventInterest) {
                allInteractions = await prisma.eventInterest.findMany({});
            }
        } catch (e) {
            console.log("ℹ Ο πίνακας eventInterest δεν βρέθηκε, συνεχίζουμε με Bookings.");
        }

        // 2. Διαβάζουμε κρατήσεις και εκδηλώσεις
        const allAttendees = await prisma.booking.findMany({});
        const allEvents = await prisma.event.findMany({ where: { status: 'PUBLISHED' } });

        // 3. Εκτέλεση αλγορίθμου
        const recommendations = await getRecommendationsForUser(userId, allInteractions, allAttendees, allEvents);
        
        res.json(recommendations);
    } catch (error) {
        console.error("❌ Κρίσιμο σφάλμα στον controller συστάσεων:", error);
        res.status(500).json({ message: 'Σφάλμα κατά τον υπολογισμό συστάσεων' });
    }
};

// Εξαγωγή όλων των συναρτήσεων
module.exports = { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  publishEvent, 
  getMyEvents, 
  createBooking,
  getMyBookings,
  getOrganizerBookings,
  exportEventsXML,
  exportEventsJSON,
  getRecommendations 
};