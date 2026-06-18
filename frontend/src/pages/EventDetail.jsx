import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api.js'

// ── Χρωματική Παλέτα ─────────────────────────────────────────────────────────
const COLORS = {
  primary: '#d2b893',    // Το μπεζ/χρυσό
  dark: '#2c2c2c',       // Σκούρο γκρι/μαύρο
  textMuted: '#555555',  // Απαλό γκρι για περιγραφές
  bgLight: '#f9f7f5',    // Το background του modal / badges
  border: '#e4dfda',     // Απαλό border
  white: '#ffffff',
  cancelledBg: '#FCEBEB',
  cancelledText: '#791F1F',
  publishedBg: '#EAF3DE',
  publishedText: '#27500A',
}

// ── Συνάρτηση Δυναμικής Εικόνας ──────────────────────────────────────────
const getEventImage = (type, title) => {
  const searchStr = `${type || ''} ${title || ''}`.toLowerCase().trim();
  if (searchStr.includes('συναυλία') || searchStr.includes('concert') || searchStr.includes('μουσική') || searchStr.includes('jazz') || searchStr.includes('live')) {
    return '/event-images/concert.jpg';
  }
  if (searchStr.includes('φεστιβάλ') || searchStr.includes('festival') || searchStr.includes('wine') || searchStr.includes('γαστρονομία')) {
    return '/event-images/festival.jpg';
  }
  if (searchStr.includes('θέατρο') || searchStr.includes('παράσταση') || searchStr.includes('theater') || searchStr.includes('cinema') || searchStr.includes('ταινία') || searchStr.includes('pulp')) {
    return '/event-images/theater.jpg';
  }
  if (searchStr.includes('σεμινάριο') || searchStr.includes('workshop') || searchStr.includes('conference') || searchStr.includes('hackathon') || searchStr.includes('code') || searchStr.includes('τεχνολογία')) {
    return '/event-images/seminar.jpg';
  }
  return '/event-images/default.jpg';
};

function formatDateTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('el-GR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── ΔΙΟΡΘΩΜΕΝΟ MAP COMPONENT ──────────────────────────────────────────────────
function EventMap({ latitude, longitude, venue }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    // 1. Μετατροπή σε καθαρούς δεκαδικούς αριθμούς
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    const L = window.L
    if (!L) { console.error('Leaflet not loaded'); return }

    // 2. Αν ο χάρτης υπάρχει ήδη, άλλαξε απλά το κέντρο και το Marker δυναμικά!
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(`<strong style="font-family:Montserrat,sans-serif">${venue || 'Χώρος εκδήλωσης'}</strong>`);
      }
      return;
    }

    // 3. Αρχική δημιουργία χάρτη αν δεν υπάρχει
    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
      .setView([lat, lng], 15)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;border-radius:50% 50% 50% 0;
        background:${COLORS.primary};border:3px solid ${COLORS.dark};
        transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.25);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })

    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<strong style="font-family:Montserrat,sans-serif">${venue || 'Χώρος εκδήλωσης'}</strong>`)
      .openPopup()

    // Κρατάμε references για να μπορούμε να τα πειράξουμε στο επόμενο render
    mapInstanceRef.current = map
    markerRef.current = marker

    // Καθαρισμός κατά το unmount
    return () => { 
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove(); 
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, venue])

  if (!latitude || !longitude) {
    return (
      <div style={styles.mapPlaceholder}>
        Δεν υπάρχουν διαθέσιμες γεωγραφικές συντεταγμένες
      </div>
    )
  }

  return <div ref={mapRef} style={styles.map} />
}

// ── Booking Modal Component ───────────────────────────────────────────────────
function BookingModal({ event, ticketType, onConfirm, onCancel, isBooking }) {
  const [quantity, setQuantity] = useState(1)
  const total = (quantity * parseFloat(ticketType.price || 0)).toFixed(2)

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Επιβεβαίωση Κράτησης</h2>
        <p style={styles.modalEvent}>{event.title}</p>

        <div style={styles.modalRow}>
          <span style={styles.modalLabel}>Τύπος εισιτηρίου</span>
          <span style={styles.modalValue}>{ticketType.name}</span>
        </div>
        <div style={styles.modalRow}>
          <span style={styles.modalLabel}>Τιμή / εισιτήριο</span>
          <span style={styles.modalValue}>€{parseFloat(ticketType.price).toFixed(2)}</span>
        </div>
        <div style={styles.modalRow}>
          <span style={styles.modalLabel}>Διαθέσιμα</span>
          <span style={styles.modalValue}>{ticketType.available}</span>
        </div>

        <div style={styles.qtyRow}>
          <label style={styles.modalLabel}>Αριθμός εισιτηρίων</label>
          <div style={styles.qtyControl}>
            <button style={styles.qtyBtn}
              onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
            <span style={styles.qtyNum}>{quantity}</span>
            <button style={styles.qtyBtn}
              onClick={() => setQuantity(q => Math.min(ticketType.available, q + 1))}>+</button>
          </div>
        </div>

        <div style={styles.totalRow}>
          <span style={{ fontWeight: 700 }}>Σύνολο</span>
          <span style={styles.totalAmount}>€{total}</span>
        </div>

        {/* Διορθωμένο modalWarning με div και flex */}
        <div style={{ ...styles.modalWarning, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/warning.png" 
            alt="warning" 
            style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }} 
          />
          <span>
            Η κράτηση δεν μπορεί να αναιρεθεί μετά την οριστική υποβολή.
          </span>
        </div>

        <div style={styles.modalButtons}>
          <button style={styles.cancelBtn} onClick={onCancel} disabled={isBooking}>Ακύρωση</button>
          <button 
            style={{...styles.confirmBtn, opacity: isBooking ? 0.7 : 1}} 
            onClick={() => onConfirm(quantity, total)}
            disabled={isBooking}
          >
            {isBooking ? 'Γίνεται κράτηση...' : 'Οριστική Υποβολή'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isBooking, setIsBooking] = useState(false);
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [bookingError, setBookingError] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  
  const handleContactOrganizer = () => {
    navigate('/messages', { 
      state: { 
        recipientId: event.organizerId, 
        recipientName: `${event.organizer?.firstName || ''} ${event.organizer?.lastName || ''}`,
        subject: event.title,
        eventId: event.id,       // ✅ Αυτό λείπει!
        eventTitle: event.title  // ✅ Αυτό λείπει!
      } 
    });
  };

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    api.get(`/events/${id}`)
      .then(res => {
        const mappedEvent = {
          ...res.data,
          desc: res.data.description, 
          cats: (res.data.categories || []).map(c => c.name || c),
          start: res.data.startDateTime,
          available: (res.data.ticketTypes || []).reduce((sum, t) => sum + t.available, 0)
        }
        setEvent(mappedEvent)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching event details:", err)
        setError('Σφάλμα φόρτωσης εκδήλωσης.')
        setLoading(false)
      })
  }, [id])

  async function handleConfirmBooking(quantity, totalCost) {
    setIsBooking(true);
    setBookingError(null);
    
    try {
      await api.post(`/events/${id}/bookings`, {
        ticketTypeId: selectedTicket.id,
        numberOfTickets: quantity,
        totalCost,
      });

      setEvent(prev => {
        const updatedTickets = prev.ticketTypes.map(t =>
          t.id === selectedTicket.id ? { ...t, available: t.available - quantity } : t
        );
        return {
          ...prev,
          ticketTypes: updatedTickets,
          available: updatedTickets.reduce((sum, t) => sum + t.available, 0)
        };
      });

      window.alert("Η κράτηση ολοκληρώθηκε επιτυχώς!"); 
      setShowModal(false);
      setBookingSuccess("Επιτυχής κράτηση!");
    } catch (e) {
      console.error("Σφάλμα κράτησης:", e);
      const errorMsg = e.response?.data?.message || 'Αποτυχία κράτησης στο Supabase.';
      window.alert("Σφάλμα: " + errorMsg);
      setBookingError(errorMsg);
    } finally {
      setIsBooking(false);
    }
  }

  if (loading) return (
    <div style={styles.statusPage}>
      <p style={{ fontSize: 18, fontWeight: 600, color: COLORS.dark }}>Φόρτωση εκδήλωσης...</p>
    </div>
  )
  
  if (error) return (
    <div style={styles.statusPage}>
      <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.cancelledText }}>{error}</p>
    </div>
  )
  
  if (!event) return null

  const isActive = event.status === 'PUBLISHED'
  const isCancelled = event.status === 'CANCELLED'
  const lat = event.geoLocation?.latitude ?? event.latitude
  const lng = event.geoLocation?.longitude ?? event.longitude
  const eventCats = event.cats || event.categories || []

  const displayPrice = event.ticketTypes && event.ticketTypes.length > 0 
    ? parseFloat(event.ticketTypes[0].price) === 0 ? 'Δωρεάν' : `${parseFloat(event.ticketTypes[0].price)}€`
    : '-';

  const finalEventImage = event.photos && event.photos.length > 0 
    ? event.photos[0] 
    : getEventImage(event.eventType, event.title);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/events')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <img 
              src="/back.png"  
              alt="back to events" 
              style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0 }} 
            /> 
            ΠΙΣΩ ΣΤΙΣ ΕΚΔΗΛΩΣΕΙΣ
          </div>
        </button>
      </div>

      {/* ── Κύριο Split Layout ── */}
      <div style={styles.mainContainer}>
        
        {/* ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ */}
        <div style={styles.leftColumn}>
          <div style={styles.imageContainer}>
            <img src={finalEventImage} alt={event.title} style={styles.mainImage} />
          </div>

          {bookingSuccess && <div style={styles.successBanner}>✅ {bookingSuccess}</div>}
          {bookingError && <div style={styles.errorBanner}>❌ {bookingError}</div>}

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Περιγραφη</h2>
            <p style={styles.description}>{event.desc || event.description}</p>
          </section>

          {/* Διορθωμένο Section Τοποθεσίας με το εικονίδιο pin */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Τοποθεσια</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <img 
                src="/pin.png" 
                alt="location pin" 
                style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0 }} 
              />
              <span style={{ color: COLORS.textMuted, fontSize: '13.5px' }}>
                {event.address || event.venue}, {event.city}, {event.country}
              </span>
            </div>
            <EventMap key={event.id} latitude={lat} longitude={lng} venue={event.venue} />
          </section>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Εισιτηρια</h2>
            <p style={styles.capacity}>
              Συνολική χωρητικότητα: <strong>{event.capacity}</strong> θέσεις
            </p>
            <div style={styles.ticketGrid}>
              {(event.ticketTypes || []).map(t => {
                const bookedTickets = t.quantity - t.available;
                // ─── ΔΙΟΡΘΩΣΗ: Η μπάρα δείχνει το ποσοστό των ΔΙΑΘΕΣΙΜΩΝ θέσεων ───
                // Ξεκινάει από το 100% (γεμάτη πράσινη) και μειώνεται καθώς γίνονται κρατήσεις
                const pct = Math.round((t.available / t.quantity) * 100);

                const sold = isCancelled || t.available === 0;
                const availabilityRatio = t.available / t.quantity;

                // Το χρώμα αλλάζει με βάση το πόσο τοις εκατό των θέσεων απομένει διαθέσιμο
                const color = availabilityRatio > 0.3 
                  ? '#27500A' // Πράσινο: Πάνω από 30% των θέσεων είναι ελεύθερο
                  : t.available > 0 
                    ? '#b45309' // Πορτοκαλί: Λιγότερο από 30% διαθέσιμο (κίνδυνος!)
                    : '#791F1F'; // Κόκκινο: Εξαντλήθηκε
                const isSelected = selectedTicket?.id === t.id

                return (
                  <div key={t.id} style={{
                    ...styles.ticketCard,
                    border: `1px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                    opacity: sold ? 0.6 : 1,
                  }}>
                    <div style={styles.ticketName}>{t.name}</div>
                    <div style={styles.ticketPrice}>
                      {parseFloat(t.price) === 0 ? 'Δωρεάν' : `€${parseFloat(t.price).toFixed(2)}`}
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{ ...styles.progressFill, width: `${pct}%`, background: color }} />
                    </div>
                    <div style={{ color, fontSize: 12, marginBottom: 16 }}>
                      {t.available} / {t.quantity} διαθέσιμα
                    </div>
                    
                    {isActive && !sold ? (
                      JSON.parse(localStorage.getItem('user'))?.role?.toUpperCase() === 'ATTENDEE' ? (
                      <button
                        style={{
                          ...styles.bookBtn,
                          backgroundColor: isSelected ? COLORS.dark : COLORS.primary,
                          color: isSelected ? COLORS.white : COLORS.dark,
                        }}
                        onClick={() => {
                          setSelectedTicket(t)
                          setBookingSuccess(null)
                          setBookingError(null)
                          setShowModal(true)
                        }}
                      >
                        ΚΡΑΤΗΣΗ
                      </button>
                    ) : (
                      <div style={{ textAlign: 'center', marginTop: 10 }}>
                        <p style={{ fontSize: 11, color: '#b45309', fontWeight: 600, marginBottom: 8 }}>
                          {JSON.parse(localStorage.getItem('user')) 
                            ? 'Μόνο οι συμμετέχοντες μπορούν να κάνουν κράτηση' 
                            : 'Συνδεθείτε για κράτηση'}
                        </p>
                        <button 
                          style={{ ...styles.bookBtn, backgroundColor: '#eee', color: '#777', fontSize: 10 }}
                          onClick={() => {
                            // Αν είναι ήδη συνδεδεμένος (π.χ. admin/organizer), τον αποσυνδέουμε προαιρετικά ή απλά τον στέλνουμε στο login
                            navigate('/login');
                          }}
                        >
                          ΕΙΣΟΔΟΣ ΩΣ ΣΥΜΜΕΤΕΧΩΝ
                        </button>
                      </div>
                    )
                  ) : (
                    <span style={styles.soldOut}>
                      {isCancelled ? 'Ακυρώθηκε' : 'Εξαντλήθηκαν'}
                    </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ΔΕΞΙΑ ΣΤΗΛΗ (SIDEBAR) */}
        <div style={styles.rightColumn}>
          <div style={styles.stickySidebar}>
            
            <div>
              <div style={styles.statusAndCats}>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: isCancelled ? COLORS.cancelledBg : COLORS.publishedBg,
                  color: isCancelled ? COLORS.cancelledText : COLORS.publishedText,
                }}>
                  {isCancelled ? 'ΑΚΥΡΩΜΕΝΗ' : 'ΔΗΜΟΣΙΕΥΜΕΝΗ'}
                </span>
                <div style={styles.catRow}>
                  {eventCats.map((c, index) => (
                    <span key={index} style={styles.catBadge}>{c}</span>
                  ))}
                </div>
              </div>

              <h1 style={styles.Title}>
                {(event.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}
              </h1>
              
              <div style={styles.PriceBadge}>TIMH ΑΠΟ</div>
              <div style={styles.PriceValue}>{displayPrice}</div>
            </div>
            
            {/* ΔΙΟΡΘΩΘΗΚΕ: Εδώ έγινε <div> αντί για <p> για να μην πετάει σφάλμα HTML */}
            <div style={styles.DescriptionMeta}>
              {event.eventType} · {event.venue}<br />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <img 
                  src="/calendar (1).png"  
                  alt="calendar" 
                  style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }} 
                /> 
                {formatDateTime(event.start || event.startDateTime)}
              </div>
            </div>

            {(() => {
              const currentUser = JSON.parse(localStorage.getItem('user'));
              const role = currentUser?.role?.toUpperCase();
              
              if (!currentUser || role !== 'ATTENDEE') {
                return (
                  <button 
                    style={{ ...styles.ContactBtn, backgroundColor: '#eee', color: '#777', cursor: 'pointer' }}
                    onClick={() => navigate('/login')}
                  >
                    ΕΙΣΟΔΟΣ ΩΣ ΣΥΜΜΕΤΕΧΩΝ ΓΙΑ ΕΠΙΚΟΙΝΩΝΙΑ ΜΕ ΔΙΟΡΓΑΝΩΤΗ
                  </button>
                );
              }
              
              return (
                <button 
                  onClick={handleContactOrganizer}
                  style={styles.ContactBtn}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c4aa82'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = COLORS.primary}
                >
                  ΕΠΙΚΟΙΝΩΝΙΑ ΜΕ ΔΙΟΡΓΑΝΩΤΗ
                </button>
              );
            })()}
          </div>
        </div>

      </div>

      {showModal && selectedTicket && (
        <BookingModal
          event={event}
          ticketType={selectedTicket}
          onConfirm={handleConfirmBooking} 
          onCancel={() => setShowModal(false)}
          isBooking={isBooking}
        />
      )}
    </div>
  )
}

// ── Στυλ ──────────────────────────────────────────────────────────────────────
const styles = {
  page: { backgroundColor: '#faf9f8', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', color: COLORS.dark },
  statusPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#faf9f8', fontFamily: 'Poppins, sans-serif' },
  topBar: { maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: 1, color: COLORS.textMuted, fontFamily: 'Poppins, sans-serif', padding: 0 },
  mainContainer: { display: 'flex', maxWidth: 1200, margin: '0 auto', padding: '24px', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' },
  leftColumn: { flex: '1 1 650px', minWidth: '300px' },
  rightColumn: { flex: '0 0 380px', minWidth: '300px' },
  imageContainer: { 
    width: '100%', 
    height: '395px', 
    backgroundColor: '#e6e6e6', 
    borderRadius: '4px', 
    marginBottom: '32px', 
    overflow: 'hidden' 
  },
  mainImage: { width: '100%', height: '100%', objectFit: 'cover' },
  stickySidebar: { 
    position: 'sticky', 
    top: '40px', 
    backgroundColor: COLORS.white, 
    padding: '32px', 
    borderRadius: '8px', 
    border: `1px solid ${COLORS.border}`, 
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  statusAndCats: { display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    flexWrap: 'wrap', 
    gap: '10px', 
    marginBottom: '18px' // Κρατάει το σωστό κενό που ζήτησες
  },
  statusBadge: { fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: '4px 10px', borderRadius: 2 },
  catRow: { display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  catBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`, color: COLORS.dark, borderRadius: '2px' },
  Title: { fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0', color: COLORS.dark, letterSpacing: '0.5px', lineHeight: '1.3' },
  PriceBadge: { fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' },
  PriceValue: { fontSize: '30px', fontWeight: '800', color: COLORS.dark, margin: '0', lineHeight: '1' },
  
  // Διορθώθηκε το margin/padding conflict για αποφυγή react warning
  DescriptionMeta: { 
    color: COLORS.textMuted, 
    fontSize: '14px', 
    lineHeight: '1.6', 
    borderTop: `1px solid ${COLORS.border}`, 
    paddingTop: '16px',
    paddingBottom: '4px'
  },
  ContactBtn: { 
    width: '100%', 
    backgroundColor: COLORS.primary, 
    color: '#2c2c2c',                
    border: 'none', 
    padding: '14px 0', 
    fontSize: '13px',                
    fontWeight: '700',               
    borderRadius: '4px',             
    cursor: 'pointer', 
    transition: 'background-color 0.15s ease', 
    letterSpacing: '1px',            
    textTransform: 'uppercase',
    boxShadow: '0 2px 6px rgba(210, 184, 147, 0.2)'
  },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: '16px', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.dark, marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}` },
  description: { color: COLORS.textMuted, lineHeight: '1.8', fontSize: '14px' },
  address: { color: COLORS.textMuted, fontSize: '13px', marginBottom: 14 },
  map: { width: '100%', height: 320, borderRadius: 4, border: `1px solid ${COLORS.border}` },
  mapPlaceholder: { width: '100%', height: 200, backgroundColor: COLORS.white, border: `1px dashed ${COLORS.border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: 13 },
  capacity: { color: COLORS.textMuted, fontSize: 14, marginBottom: 20 },
  ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  ticketCard: { backgroundColor: COLORS.white, borderRadius: 4, padding: 20, border: `1px solid ${COLORS.border}` },
  ticketName: { fontWeight: 700, fontSize: 14, marginBottom: 4, color: COLORS.dark },
  ticketPrice: { fontSize: 22, fontWeight: 700, color: COLORS.dark, marginBottom: 16 },
  progressBg: { height: 6, background: COLORS.border, borderRadius: 3, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease, background-color 0.4s ease' },
  bookBtn: { width: '100%', padding: '11px 0', border: 'none', borderRadius: 4, fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 1, cursor: 'pointer', transition: 'background-color .15s' },
  soldOut: { display: 'block', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  photo: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 4 },
  successBanner: { backgroundColor: COLORS.publishedBg, border: `1px solid ${COLORS.publishedText}`, padding: '14px 18px', marginBottom: 24, color: COLORS.publishedText, fontSize: 14, fontWeight: 600, borderRadius: 4 },
  errorBanner: { backgroundColor: COLORS.cancelledBg, border: `1px solid ${COLORS.cancelledText}`, padding: '14px 18px', marginBottom: 24, color: COLORS.cancelledText, fontSize: 14, fontWeight: 600, borderRadius: 4 },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 32, width: '100%', maxWidth: 440, fontFamily: 'Poppins, sans-serif' },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: COLORS.dark },
  modalEvent: { color: COLORS.textMuted, fontSize: 13, marginBottom: 24 },
  modalRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.bgLight}` },
  modalLabel: { color: COLORS.textMuted, fontSize: 13 },
  modalValue: { fontSize: 13, fontWeight: 600, color: COLORS.dark },
  qtyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 32, height: 32, borderRadius: '50%', backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`, color: COLORS.dark, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${COLORS.border}`, marginTop: 4 },
  totalAmount: { fontSize: 22, fontWeight: 700, color: COLORS.dark },
  modalWarning: { color: '#b45309', fontSize: '12px', lineHeight: '1.5', margin: '14px 0', backgroundColor: '#fffbeb', padding: '10px 14px', border: '1px solid #fcd34d', borderRadius: 4 },
  modalButtons: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: '12px 0', borderRadius: 4, backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 700 },
  confirmBtn: { flex: 2, padding: '12px 0', borderRadius: 4, backgroundColor: COLORS.primary, border: 'none', color: COLORS.dark, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: 1 },
}