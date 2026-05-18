import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api.js' // Έγινε η προσθήκη εδώ

// ── Leaflet (OpenStreetMap) via CDN ──────────────────────────────────────────
// Βεβαιώσου ότι στο index.html έχεις:
//   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
//   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

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

function formatDateTime(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('el-GR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function availabilityPct(available, quantity) {
  if (!quantity) return 0
  return Math.round((available / quantity) * 100)
}

function availabilityColor(available, quantity) {
  const pct = available / quantity
  if (pct > 0.3) return '#27500A'
  if (pct > 0) return '#b45309'
  return '#791F1F'
}

// ── Map Component ────────────────────────────────────────────────────────────
function EventMap({ latitude, longitude, venue }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!latitude || !longitude) return
    if (mapInstanceRef.current) return

    const L = window.L
    if (!L) { console.error('Leaflet not loaded'); return }

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
      .setView([latitude, longitude], 15)

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

    L.marker([latitude, longitude], { icon })
      .addTo(map)
      .bindPopup(`<strong style="font-family:Montserrat,sans-serif">${venue || 'Χώρος εκδήλωσης'}</strong>`)
      .openPopup()

    mapInstanceRef.current = map
    return () => { map.remove(); mapInstanceRef.current = null }
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
function BookingModal({ event, ticketType, onConfirm, onCancel }) {
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

        <p style={styles.modalWarning}>
          ⚠️ Η κράτηση δεν μπορεί να αναιρεθεί μετά την οριστική υποβολή.
        </p>

        <div style={styles.modalButtons}>
          <button style={styles.cancelBtn} onClick={onCancel}>Ακύρωση</button>
          <button style={styles.confirmBtn} onClick={() => onConfirm(quantity, total)}>
            Οριστική Υποβολή
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

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(null)
  const [bookingError, setBookingError] = useState(null)

  // 1. Fetch Event Details χρησιμοποιώντας το api service (Axios)
  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)

    api.get(`/events/${id}`)
      .then(res => {
        // Mapping των πεδίων της βάσης με την ίδια λογική του 2ου αρχείου
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

  // 2. Υποβολή Κράτησης (Booking) χρησιμοποιώντας το api service
  async function handleConfirmBooking(quantity, totalCost) {
    setBookingError(null)
    setBookingSuccess(null)
    
    try {
      await api.post(`/events/${id}/bookings`, {
        ticketTypeId: selectedTicket.id,
        numberOfTickets: quantity,
        totalCost,
      })

      // Local update του state για άμεση μείωση των εισιτηρίων στην οθόνη
      setEvent(prev => ({
        ...prev,
        ticketTypes: prev.ticketTypes.map(t =>
          t.id === selectedTicket.id
            ? { ...t, available: t.available - quantity }
            : t
        ),
        available: prev.available - quantity
      }))

      setBookingSuccess(`Η κράτησή σας υποβλήθηκε επιτυχώς! (${quantity} εισιτήρια, σύνολο €${totalCost})`)
      setShowModal(false)
    } catch (e) {
      setBookingError(e.response?.data?.message || 'Αποτυχία κράτησης.')
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

  return (
    <div style={styles.page}>

      {/* ── Back button ── */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate('/events')}>
          ← Πίσω στις εκδηλώσεις
        </button>
      </div>

      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
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

          <h1 style={styles.title}>{event.title}</h1>
          <p style={styles.meta}>
            {event.eventType} · {event.venue}, {event.city}, {event.country}
          </p>
          <p style={styles.dates}>
            🗓 {formatDateTime(event.start || event.startDateTime)} — {formatDateTime(event.endDateTime)}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={styles.body}>

        {bookingSuccess && (
          <div style={styles.successBanner}>✅ {bookingSuccess}</div>
        )}
        {bookingError && (
          <div style={styles.errorBanner}>❌ {bookingError}</div>
        )}

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Περιγραφη</h2>
          <p style={styles.description}>{event.desc || event.description}</p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Τοποθεσια</h2>
          <p style={styles.address}>📍 {event.address}, {event.city}, {event.country}</p>
          <EventMap latitude={lat} longitude={lng} venue={event.venue} />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Εισιτηρια</h2>
          <p style={styles.capacity}>
            Συνολική χωρητικότητα: <strong>{event.capacity}</strong> θέσεις
          </p>
          <div style={styles.ticketGrid}>
            {(event.ticketTypes || []).map(t => {
              const sold = isCancelled || t.available === 0
              const pct = availabilityPct(t.available, t.quantity)
              const color = availabilityColor(t.available, t.quantity)
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
                  {/* Έλεγχος αν η εκδήλωση είναι ενεργή και υπάρχουν εισιτήρια */}
                  {isActive && !sold ? (
                    /* ΕΣΩΤΕΡΙΚΟΣ ΕΛΕΓΧΟΣ: Είναι ο χρήστης συνδεδεμένος; */
                    localStorage.getItem('token') ? (
                      <button
                        style={{
                          ...styles.bookBtn,
                          backgroundColor: isSelected ? COLORS.dark : COLORS.primary,
                          color: isSelected ? COLORS.white : COLORS.dark,
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#c4aa82'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? COLORS.dark : COLORS.primary}
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
                      /* ΑΝ ΔΕΝ ΕΙΝΑΙ ΣΥΝΔΕΔΕΜΕΝΟΣ: Δείξε μήνυμα προτροπής */
                      <div style={{ textAlign: 'center', marginTop: 10 }}>
                        <p style={{ fontSize: 11, color: '#b45309', fontWeight: 600, marginBottom: 8 }}>
                          Συνδεθείτε για κράτηση
                        </p>
                        <button 
                          style={{ ...styles.bookBtn, backgroundColor: '#eee', color: '#777', fontSize: 10 }}
                          onClick={() => navigate('/login')}
                        >
                          ΕΙΣΟΔΟΣ
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

        {event.photos && event.photos.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Φωτογραφίες</h2>
            <div style={styles.photoGrid}>
              {event.photos.map((p, i) => (
                <img key={i} src={p} alt={`photo-${i}`} style={styles.photo} />
              ))}
            </div>
          </section>
        )}

      </div>

      {showModal && selectedTicket && (
        <BookingModal
          event={event}
          ticketType={selectedTicket}
          onConfirm={handleConfirmBooking}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    backgroundColor: '#faf9f8', // Ίδιο απαλό φόντο με το Browse
    minHeight: '100vh',
    fontFamily: 'Montserrat, sans-serif',
    color: COLORS.dark,
    overflowY: 'auto',
  },
  statusPage: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: '#faf9f8',
    fontFamily: 'Montserrat, sans-serif',
  },
  topBar: { maxWidth: 900, margin: '0 auto', padding: '24px 24px 0' },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, letterSpacing: 1,
    color: COLORS.textMuted, fontFamily: 'Montserrat, sans-serif', padding: 0,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: '28px 0', marginTop: 16,
  },
  headerInner: { maxWidth: 900, margin: '0 auto', padding: '0 24px' },
  statusBadge: {
    display: 'inline-block', fontSize: 11, fontWeight: 700,
    letterSpacing: 1, padding: '4px 12px', borderRadius: 1, marginBottom: 14,
  },
  catRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  catBadge: {
    fontSize: 11, fontWeight: 600, padding: '3px 10px',
    backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`, color: COLORS.dark,
  },
  title: {
    fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 700,
    margin: '0 0 10px', lineHeight: 1.2, color: COLORS.dark,
  },
  meta: { color: COLORS.textMuted, fontSize: 14, margin: '0 0 6px' },
  dates: { color: COLORS.textMuted, fontSize: 13, margin: 0 },
  body: { maxWidth: 900, margin: '0 auto', padding: '36px 24px 80px' },
  section: { marginBottom: 44 },
  sectionTitle: {
    fontSize: 15, fontWeight: 700, letterSpacing: 2,
    textTransform: 'uppercase', color: COLORS.dark,
    marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}`,
  },
  description: { color: COLORS.textMuted, lineHeight: 1.8, fontSize: 15 },
  address: { color: COLORS.textMuted, fontSize: 13, marginBottom: 14 },
  map: { width: '100%', height: 320, borderRadius: 1, border: `1px solid ${COLORS.border}` },
  mapPlaceholder: {
    width: '100%', height: 200, backgroundColor: COLORS.white,
    border: `1px dashed ${COLORS.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: COLORS.textMuted, fontSize: 13,
  },
  capacity: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },
  ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 },
  ticketCard: { backgroundColor: COLORS.white, borderRadius: 1, padding: 20, transition: 'border-color .2s' },
  ticketName: { fontWeight: 700, fontSize: 14, marginBottom: 4, color: COLORS.dark },
  ticketPrice: { fontSize: 22, fontWeight: 700, color: COLORS.dark, marginBottom: 16 },
  progressBg: { height: 4, background: COLORS.border, borderRadius: 2, marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 2, transition: 'width .4s' },
  bookBtn: {
    width: '100%', padding: '11px 0', border: 'none', borderRadius: 1,
    fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
    letterSpacing: 1, cursor: 'pointer', transition: 'background-color .15s',
  },
  soldOut: { display: 'block', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  photo: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 1 },
  successBanner: {
    backgroundColor: COLORS.publishedBg, border: `1px solid ${COLORS.publishedText}`,
    borderRadius: 1, padding: '14px 18px', marginBottom: 24,
    color: COLORS.publishedText, fontSize: 14, fontWeight: 600,
  },
  errorBanner: {
    backgroundColor: COLORS.cancelledBg, border: `1px solid ${COLORS.cancelledText}`,
    borderRadius: 1, padding: '14px 18px', marginBottom: 24,
    color: COLORS.cancelledText, fontSize: 14, fontWeight: 600,
  },
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`,
    borderRadius: 1, padding: 32, width: '100%', maxWidth: 440,
    fontFamily: 'Montserrat, sans-serif',
  },
  modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: COLORS.dark },
  modalEvent: { color: COLORS.textMuted, fontSize: 13, marginBottom: 24 },
  modalRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${COLORS.bgLight}` },
  modalLabel: { color: COLORS.textMuted, fontSize: 13 },
  modalValue: { fontSize: 13, fontWeight: 600, color: COLORS.dark },
  qtyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 14 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`,
    color: COLORS.dark, fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  qtyNum: { fontSize: 20, fontWeight: 700, minWidth: 24, textAlign: 'center' },
  totalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderTop: `1px solid ${COLORS.border}`, marginTop: 4,
  },
  totalAmount: { fontSize: 22, fontWeight: 700, color: COLORS.dark },
  modalWarning: {
    color: '#b45309', fontSize: 12, lineHeight: 1.5, margin: '14px 0',
    backgroundColor: '#fffbeb', padding: '10px 12px',
    border: '1px solid #fcd34d', borderRadius: 1,
  },
  modalButtons: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: '12px 0', borderRadius: 1,
    backgroundColor: COLORS.bgLight, border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted, cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700,
  },
  confirmBtn: {
    flex: 2, padding: '12px 0', borderRadius: 1,
    backgroundColor: COLORS.primary, border: 'none',
    color: COLORS.dark, cursor: 'pointer',
    fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, letterSpacing: 1,
  },
}