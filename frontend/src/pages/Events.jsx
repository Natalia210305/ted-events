import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PER_PAGE = 6;

// Παλέτα χρωμάτων από το Home.jsx σου
const COLORS = {
  primary: '#d2b893',      // Το μπεζ/χρυσό
  dark: '#2c2c2c',         // Σκούρο γκρι/μαύρο
  textMuted: '#555555',    // Απαλό γκρι για περιγραφές
  bgLight: '#f9f7f5',      // Το background του modal
  border: '#e4dfda',       // Απαλό border
  white: '#ffffff',
  cancelledBg: '#FCEBEB',
  cancelledText: '#791F1F',
  publishedBg: '#EAF3DE',
  publishedText: '#27500A'
};

const getEventImage = (type, title) => {
  // Ενώνουμε τον τύπο και τον τίτλο για να ψάξουμε λέξεις-κλειδιά
  const searchStr = `${type || ''} ${title || ''}`.toLowerCase().trim();
  
  if (
    searchStr.includes('συναυλία') || 
    searchStr.includes('concert') || 
    searchStr.includes('μουσική') || 
    searchStr.includes('jazz') || 
    searchStr.includes('live')
  ) {
    return '/event-images/concert.jpg';
  }
  
  if (
    searchStr.includes('φεστιβάλ') || 
    searchStr.includes('festival') || 
    searchStr.includes('wine') || 
    searchStr.includes('γαστρονομία')
  ) {
    return '/event-images/festival.jpg';
  }
  
  if (
    searchStr.includes('θέατρο') || 
    searchStr.includes('παράσταση') || 
    searchStr.includes('theater') || 
    searchStr.includes('cinema') || 
    searchStr.includes('ταινία') || 
    searchStr.includes('pulp')
  ) {
    return '/event-images/theater.jpg';
  }
  
  if (
    searchStr.includes('σεμινάριο') || 
    searchStr.includes('workshop') || 
    searchStr.includes('conference') || 
    searchStr.includes('hackathon') || 
    searchStr.includes('code') || 
    searchStr.includes('τεχνολογία')
  ) {
    return '/event-images/seminar.jpg';
  }
  
  // Αν δεν βρει τίποτα, επιστρέφει το custom κολλάζ του Canva
  return '/event-images/default.jpg';
};

export default function EventsBrowse() {
  const navigate = useNavigate();
  // 1. Δημιουργία state για τα δυναμικά events της βάσης
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // States για τα φίλτρα
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('date');
  const [activeCat, setActiveCat] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // 2. useEffect Hook: Τραβάει τα δεδομένα από το Backend κατά το αρχικό φόρτωμα
  useEffect(() => {
    const fetchEventsFromBackend = async () => {
      try {
        setLoading(true);
        
        // Αντικατάστησε το URL με το δικό σου endpoint (π.χ., http://localhost:3000/api/events)
        const response = await fetch('http://localhost:3000/api/events', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Αν το API σου ζητάει JWT token για τους επισκέπτες, ξεσχολίασε την από κάτω γραμμή:
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Αποτυχία ανάκτησης δεδομένων από τον server.');
        }

        const data = await response.json();

        // Map τα fields της βάσης στα fields που περιμένει το component
        const mapped = data.map(e => ({
          ...e,
          desc: e.description,                          // fix: description → desc
          cats: (e.categories || []).map(c => c.name),  // fix: [{name}] → ['Τεχνολογία']
          start: e.startDateTime,                        // fix: startDateTime → start
          available: (e.ticketTypes || []).reduce((sum, t) => sum + t.available, 0), // συνολικές θέσεις
          minPrice: e.ticketTypes?.length > 0 ? Math.min(...e.ticketTypes.map(t => t.price)) : 0,}));

        
        // Προσαρμογή: Βεβαιώσου ότι το mapping των πεδίων ταιριάζει με τα ονόματα της PostgreSQL σου
        // Αν η βάση επιστρέφει π.χ. start_date αντί για start, μπορείς να τα κάνεις map εδώ.
        setEvents(mapped); 
      } catch (error) {
        console.error("Error fetching events:", error);
        setErrorMessage('Δεν ήταν δυνατή η φόρτωση των εκδηλώσεων. Παρακαλώ δοκιμάστε αργότερα.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventsFromBackend();
  }, []);

  // 3. Δυναμικός υπολογισμός των κατηγοριών από τα events που ήρθαν
  const CATS = [...new Set(events.flatMap(e => e.cats || e.categories || []))].sort();

  // Συναρτήσεις διαχείρισης ενεργειών
  const handleViewEvent = (id) => {
  navigate(`/events/${id}`);
};

const handleBookEvent = (e, id) => {
  e.stopPropagation();
  navigate(`/events/${id}`);
};

  const filteredEvents = events.filter(event => {
  const eventCats = event.cats || event.categories || [];
  if (activeCat && !eventCats.includes(activeCat)) return false;

  // Βελτιωμένο φίλτρο πόλης
  if (selectedCity) {
    // Παίρνουμε την πόλη από το event (είτε city είτε City βάσει DTD)
    const eventCity = (event.city || event.City || "").toString().trim().toLowerCase();
    const filterCity = selectedCity.trim().toLowerCase();
    
    if (eventCity !== filterCity) return false;
  }

  if (searchQuery) {
    const title = (event.title || "").toLowerCase();
    const desc = (event.desc || event.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    if (!title.includes(query) && !desc.includes(query)) return false;
  }
  
  if (selectedPrice) {
    const [lo, hi] = selectedPrice === '30+' ? [30, 99999] : selectedPrice.split('-').map(Number);
    if (event.minPrice < lo || event.minPrice > hi) return false;
  }
  return true;
  }).sort((a, b) => {
    if (selectedSort === 'price_asc') return a.minPrice - b.minPrice;
    if (selectedSort === 'price_desc') return b.minPrice - a.minPrice;
    return new Date(a.start || a.startDateTime) - new Date(b.start || b.startDateTime);
  });

  // Pagination Logic
  const totalEvents = filteredEvents.length;
  const totalPages = Math.ceil(totalEvents / PER_PAGE);
  const validCurrentPage = currentPage > totalPages ? 1 : currentPage;
  const startIndex = (validCurrentPage - 1) * PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + PER_PAGE);

  // Format ημερομηνίας
  const formatDate = (str) => {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

  // Κατάσταση Loading ή Σφάλματος
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#faf9f8', fontFamily: 'Poppins, sans-serif' }}>
        <p style={{ fontSize: '18px', color: COLORS.dark, fontWeight: '600' }}>Φόρτωση εκδηλώσεων...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#faf9f8', fontFamily: 'Poppins, sans-serif', padding: '20px' }}>
        <p style={{ fontSize: '16px', color: COLORS.cancelledText, fontWeight: '600', textAlign: 'center' }}>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#faf9f8', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* ─── TOPBAR: ΤΙΤΛΟΣ & PREMIUM ΑΝΑΖΗΤΗΣΗ ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', marginBottom: '35px' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: COLORS.dark, letterSpacing: '1px', margin: 0 }}>ΕΚΔΗΛΩΣΕΙΣ</h1>
            <div style={{ width: '50px', height: '4px', backgroundColor: COLORS.primary, marginTop: '8px' }} />
          </div>
          
          <div style={{ display: 'flex', position: 'relative', flex: '1', minWidth: '280px', maxWidth: '450px' }}>
            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: '#888' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Αναζήτηση τίτλου ή περιγραφής..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ 
                flex: 1, 
                padding: '14px 14px 14px 45px', 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: '50px', 
                fontSize: '14px', 
                outline: 'none', 
                backgroundColor: COLORS.white,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                fontFamily: 'Montserrat, sans-serif'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = COLORS.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = COLORS.border}
            />
          </div>
        </div>

        {/* ─── FILTERS ROW (Premium Selects & Dates) ─── */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '35px', backgroundColor: COLORS.white, padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: COLORS.dark, letterSpacing: '1px', textTransform: 'uppercase' }}>Φίλτρα:</span>
          
          <select 
            value={selectedCity} 
            onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark }}
          >
            <option value="">📍 Πόλη (όλες)</option>
            <option value="Αθήνα">Αθήνα</option>
            <option value="Θεσσαλονίκη">Θεσσαλονίκη</option>
            <option value="Πάτρα">Πάτρα</option>
            <option value="Ηράκλειο">Ηράκλειο</option>
            <option value="Λάρισα">Λάρισα</option>
            <option value="Βόλος">Βόλος</option>
            <option value="Ιωάννινα">Ιωάννινα</option>
            <option value="Χανιά">Χανιά</option>
            <option value="Πρέβεζα">Πρέβεζα</option>
            <option value="Ηγουμενίτσα">Ηγουμενίτσα</option>
            <option value="Άρτα">Άρτα</option>
            <option value="Καβάλα">Καβάλα</option>
            <option value="Αγρίνιο">Αγρίνιο</option>
            <option value="Τρίπολη">Τρίπολη</option>
            <option value="Αμφιλοχία">Αμφιλοχία</option>
            <option value="Χαλκίδα">Χαλκίδα</option>
            <option value="Ναύπλιο">Ναύπλιο</option>
            <option value="Αλεξανδρούπολη">Αλεξανδρούπολη</option>
            <option value="Ξάνθη">Ξάνθη</option>
          </select>

          <select 
            value={selectedPrice} 
            onChange={(e) => { setSelectedPrice(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark }}
          >
            <option value="">💰 Τιμή (όλες)</option>
            <option value="0-15">0–15€</option>
            <option value="15-30">15–30€</option>
            <option value="30+">30€+</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', padding: '4px 14px', backgroundColor: '#fcfbfa' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#888' }}>ΑΠΟ:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', outline: 'none', color: COLORS.dark, cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', padding: '4px 14px', backgroundColor: '#fcfbfa' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#888' }}>ΕΩΣ:</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              style={{ border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', outline: 'none', color: COLORS.dark, cursor: 'pointer' }}
            />
          </div>

          <select 
            value={selectedSort} 
            onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark, marginLeft: 'auto' }}
          >
            <option value="date">🕒 Ταξινόμηση: Ημερομηνία</option>
            <option value="price_asc">📈 Τιμή (αύξουσα)</option>
            <option value="price_desc">📉 Τιμή (φθίνουσα)</option>
          </select>
        </div>

       {/* ─── CATEGORY PILLS (Horizontal Scroll Look) ─── */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          overflowX: 'auto', 
          whiteSpace: 'nowrap', 
          paddingBottom: '15px',
          marginBottom: '20px',
          scrollbarWidth: 'none', /* Κρύβει τη μπάρα σε Firefox */
          msOverflowStyle: 'none' /* Κρύβει τη μπάρα σε IE/Edge */
        }}>
          <button 
            onClick={() => { setActiveCat(null); setCurrentPage(1); }}
            style={{
              padding: '10px 24px', 
              borderRadius: '50px', 
              backgroundColor: !activeCat ? COLORS.primary : COLORS.white, 
              color: 'black',
              boxShadow: !activeCat ? '0 4px 15px rgba(210, 184, 147, 0.3)' : 'none',
              border: !activeCat ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              fontSize: '12px', 
              fontWeight: '700', 
              cursor: 'pointer', 
              letterSpacing: '1px',
              transition: 'all 0.2s ease',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            ΟΛΕΣ
          </button>
          {CATS.map(cat => {
            const isActive = activeCat === cat;
            return (
              <button 
                key={cat}
                onClick={() => { setActiveCat(cat); setCurrentPage(1); }}
                style={{
                  padding: '10px 24px', 
                  borderRadius: '50px', 
                  backgroundColor: isActive ? COLORS.primary : COLORS.white, 
                  color: 'black',
                  border: isActive ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  boxShadow: isActive ? '0 4px 15px rgba(210, 184, 147, 0.3)' : 'none',
                  fontSize: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer', 
                  letterSpacing: '1px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = COLORS.bgLight; }}
                onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = COLORS.white; }}
              >
                {cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Results Count Info */}
        <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '25px', fontWeight: '600', letterSpacing: '0.5px' }}>
          ✨ Βρέθηκαν {totalEvents} εκδηλώσεις
        </div>

        {/* Events Grid */}
        {paginatedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted, backgroundColor: COLORS.white }}>
            Δεν βρέθηκαν εκδηλώσεις που να ταιριάζουν με τα κριτήρια.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {paginatedEvents.map(event => {
              const isAvailable = (event.status === 'PUBLISHED' || event.status === 'DRAFT') && event.available > 0;
              const isCancelled = event.status === 'CANCELLED';
              const eventCats = event.cats || [];

              return (
                <div 
                  key={event.id || event.EventID}
                  onClick={() => handleViewEvent(event.id || event.EventID)}
                  style={{
                    backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: '1px',
                    overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* ΣΩΣΤΟ CARD HEADER: Η φωτογραφία γεμίζει όλο το πλαίσιο και το badge κάθεται από πάνω της */}
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={getEventImage(event.eventType, event.title)} // <-- Προσθέσαμε και το event.title
                      alt={event.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                      <span style={{
                      position: 'absolute', top: '12px', right: '12px', fontSize: '11px', fontWeight: '700',
                      padding: '4px 12px', borderRadius: '1px', letterSpacing: '1px',
                      backgroundColor: isCancelled ? COLORS.cancelledBg : COLORS.publishedBg,
                      color: isCancelled ? COLORS.cancelledText : COLORS.publishedText
                    }}>
                      {isCancelled ? 'ΑΚΥΡΩΜΕΝΗ' : 'ΔΗΜΟΣΙΕΥΜΕΝΗ'}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {eventCats.map(c => (
                        <span key={c} style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: COLORS.bgLight, color: COLORS.dark, border: `1px solid ${COLORS.border}`, fontWeight: '600' }}>
                          {c}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: COLORS.dark, marginBottom: '12px', lineHeight: '1.4' }}>
                      {event.title}
                    </h3>

                    <div style={{ fontSize: '13px', color: COLORS.textMuted, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      <div>📅 {formatDate(event.start || event.startDateTime)}</div>
                      <div>📍 {event.venue}, {event.city}</div>
                      <div>
                        👥 {event.available === 0 ? (
                          <span style={{ color: COLORS.cancelledText, fontWeight: '700' }}>Εξαντλήθηκε</span>
                        ) : (
                          <span>{event.available} θέσεις διαθέσιμες</span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: `1px solid ${COLORS.bgLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Τιμη απο</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.dark }}>
                          {event.minPrice === 0 ? 'Δωρεάν' : `${event.minPrice}€`}
                        </div>
                      </div>
                      
                      <button 
                        disabled={!isAvailable}
                        onClick={(e) => handleBookEvent(e, event.id || event.EventID)}
                        style={{
                          padding: '10px 20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', border: 'none', borderRadius: '1px',
                          backgroundColor: isAvailable ? COLORS.primary : '#e0e0e0',
                          color: isAvailable ? 'black' : '#888888',
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => { if(isAvailable) e.currentTarget.style.backgroundColor = '#c4aa82'; }}
                        onMouseLeave={(e) => { if(isAvailable) e.currentTarget.style.backgroundColor = COLORS.primary; }}
                      >
                        {isAvailable ? 'ΠΕΡΙΣΣΟΤΕΡΑ' : 'ΜΗ ΔΙΑΘΕΣΙΜΟ'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Pagination Buttons */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${validCurrentPage === page ? COLORS.primary : COLORS.border}`,
                  backgroundColor: validCurrentPage === page ? COLORS.primary : COLORS.white,
                  color: 'black', fontWeight: '600', fontSize: '14px', cursor: 'pointer', borderRadius: '1px'
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}