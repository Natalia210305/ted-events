require('dotenv').config();
 
const prisma = require('./src/db'); 
 
function convertToUUID(idNum) {
    const hex = parseInt(idNum).toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
}
 
async function seed() {
    console.log("🚀 Έναρξη μαζικής εισαγωγής εκδηλώσεων στη Supabase...");
 
    const defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
        console.log("❌ Σφάλμα: Δεν βρέθηκε κανένας χρήστης στη βάση.");
        return;
    }
 
    const mockEvents = [
        { title: "Rock Wave Festival 2026", type: "Συναυλία", desc: "Το μεγαλύτερο rock φεστιβάλ της χρονιάς με headliners παγκοσμίου φήμης.", venue: "Θέατρο Βράχων", address: "Βύρωνας", city: "Αθήνα", cap: 5000, lat: 37.9531, lng: 23.7654, ticketPrice: 35 },
        { title: "Tech & AI Innovation Summit", type: "Συνέδριο", desc: "Μίλα με τους ειδικούς της τεχνητής νοημοσύνης και δες τα νέα μοντέλα LLMs από κοντά.", venue: "Μέγαρο Μουσικής", address: "Βασ. Σοφίας", city: "Αθήνα", cap: 1500, lat: 37.9804, lng: 23.7547, ticketPrice: 50 },
        { title: "Athens Street Food Festival", type: "Φεστιβάλ", desc: "Γεύσεις από όλο τον κόσμο, street food, γλυκά και δροσερά κοκτέιλ με live DJs.", venue: "Παλιό Αμαξοστάσιο ΟΣΥ", address: "Πειραιώς & Ερμού", city: "Αθήνα", cap: 3000, lat: 37.9774, lng: 23.7174, ticketPrice: 8 },
        { title: "Stand Up Comedy Night", type: "Θέατρο", desc: "Οι καλύτεροι Έλληνες κωμικοί σε μια βραδιά γεμάτη γέλιο μέχρι δακρύων.", venue: "Λόφος Λυκαβηττού", address: "Λυκαβηττός", city: "Αθήνα", cap: 800, lat: 37.9819, lng: 23.7432, ticketPrice: 12 },
        { title: "Blockchain & Web3 Workshop", type: "Σεμινάριο", desc: "Πρακτικό εργαστήριο για smart contracts, dApps και το μέλλον των κρυπτονομισμάτων.", venue: "Impact Hub Athens", address: "Καραϊσκάκη 28", city: "Αθήνα", cap: 150, lat: 37.9788, lng: 23.7225, ticketPrice: 20 },
        { title: "Summer Jazz Nights", type: "Συναυλία", desc: "Μια μαγική καλοκαιρινή βραδιά κάτω από τα αστέρια με μελωδίες jazz και μπλουζ.", venue: "Θέατρο Rematia", address: "Χαλάνδρι", city: "Αθήνα", cap: 600, lat: 38.0211, lng: 23.8012, ticketPrice: 15 },
        { title: "Art & Photography Exhibition", type: "Έκθεση", desc: "Έκθεση σύγχρονης τέχνης και φωτογραφίας από νέους Έλληνες καλλιτέχνες.", venue: "Γκάζι Τεχνόπολη", address: "Πειραιώς 100", city: "Αθήνα", cap: 1000, lat: 37.9782, lng: 23.7135, ticketPrice: 0 },
        { title: "Startup Pitching Live 2026", type: "Συνέδριο", desc: "Ελληνικά startups παρουσιάζουν τις ιδέες τους σε ξένους επενδυτές (VCs).", venue: "CapsuleT", address: "Συγγρού 40", city: "Αθήνα", cap: 300, lat: 37.9621, lng: 23.7299, ticketPrice: 0 },
        { title: "Wine Tasting Experience", type: "Φεστιβάλ", desc: "Δοκίμασε σπάνιες ετικέτες κρασιών από τους καλύτερους αμπελώνες της Ελλάδας.", venue: "Ζάππειο Μέγαρο", address: "Λεωφ. Βασιλίσσης Όλγας", city: "Αθήνα", cap: 1200, lat: 37.9714, lng: 23.7364, ticketPrice: 25 },
        { title: "Classical Music Gala", type: "Συναυλία", desc: "Η κρατική ορχήστρα ερμηνεύει αριστουργήματα των Mozart, Beethoven και Bach.", venue: "Ωδείο Ηρώδου Αττικού", address: "Διονυσίου Αρεοπαγίτου", city: "Αθήνα", cap: 3000, lat: 37.9708, lng: 23.7246, ticketPrice: 40 },
        { title: "Indie Film Premieres", type: "Προβολή", desc: "Προβολές βραβευμένων ανεξάρτητων ταινιών μικρού και μεγάλου μήκους.", venue: "Κινηματογράφος Θησείον", address: "Αποστόλου Παύλου 7", city: "Αθήνα", cap: 250, lat: 37.9722, lng: 23.7202, ticketPrice: 8 },
        { title: "UX/UI Design Bootcamp", type: "Σεμινάριο", desc: "Μάθε πώς να σχεδιάζεις σωστά user flows και wireframes στο Figma.", venue: "Found.ation", address: "Ευρυσθέως 2", city: "Αθήνα", cap: 80, lat: 37.9711, lng: 23.7099, ticketPrice: 60 },
        { title: "Traditional Greek Dance Fest", type: "Φεστιβάλ", desc: "Παραδοσιακοί χοροί και συγκροτήματα από όλη την Ελλάδα σε ένα μεγάλο γλέντι.", venue: "Θέατρο Δώρα Στράτου", address: "Λόφος Φιλοπάππου", city: "Αθήνα", cap: 1000, lat: 37.9675, lng: 23.7212, ticketPrice: 0 },
        { title: "Gaming & Esports Tournament", type: "Έκθεση", desc: "Μεγάλα τουρνουά League of Legends και Counter-Strike με πλούσια δώρα.", venue: "Εκθεσιακό Κέντρο Περιστερίου", address: "Δωδεκανήσου 106", city: "Αθήνα", cap: 2000, lat: 38.0125, lng: 23.6822, ticketPrice: 10 },
        { title: "Digital Marketing Trends 2026", type: "Συνέδριο", desc: "Μάθε όλα τα μυστικά για το TikTok SEO, τα Google Ads και το AI Marketing.", venue: "Ξενοδοχείο Hilton", address: "Βασ. Σοφίας 46", city: "Αθήνα", cap: 500, lat: 37.9811, lng: 23.7495, ticketPrice: 15 }
    ];
 
    let count = 0;
    for (let i = 0; i < mockEvents.length; i++) {
        const item = mockEvents[i];
        const mockDatasetId = (i + 1).toString();
        const validUUID = convertToUUID(mockDatasetId);
 
        try {
            await prisma.event.upsert({
                where: { id: validUUID },
                update: {},
                create: {
                    id: validUUID,
                    title: item.title,
                    description: item.desc,
                    status: 'PUBLISHED',
                    city: item.city,
                    country: 'Ελλάδα',
                    venue: item.venue,
                    address: item.address,
                    startDateTime: new Date(Date.now() + 86400000 * (i + 2)),
                    endDateTime: new Date(Date.now() + 86400000 * (i + 2) + 7200000),
                    capacity: item.cap,
                    eventType: item.type,
                    latitude: item.lat,
                    longitude: item.lng,
                    organizer: {
                        connect: { id: defaultUser.id }
                    },
                    ticketTypes: {
                        create: {
                            name: 'General Admission',
                            price: item.ticketPrice,
                            quantity: item.cap,
                            available: item.cap,  // ← αυτό έλειπε
                        }
                    }
                }
            });
            count++;
            console.log(`✓ "${item.title}" αποθηκεύτηκε`);
        } catch (err) {
            console.error(`❌ Σφάλμα κατά την εισαγωγή του "${item.title}":`, err.message);
        }
    }
 
    console.log(`\n✅ Επιτυχία! ${count}/${mockEvents.length} εκδηλώσεις αποθηκεύτηκαν στη βάση!`);
}
 
seed()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });