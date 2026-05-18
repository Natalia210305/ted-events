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
          minPrice: Math.min(...(e.ticketTypes || [{ price: 0 }]).map(t => t.price)), // ελάχιστη τιμή
        }));

        
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#faf9f8', fontFamily: 'Montserrat, sans-serif' }}>
        <p style={{ fontSize: '18px', color: COLORS.dark, fontWeight: '600' }}>Φόρτωση εκδηλώσεων...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#faf9f8', fontFamily: 'Montserrat, sans-serif', padding: '20px' }}>
        <p style={{ fontSize: '16px', color: COLORS.cancelledText, fontWeight: '600', textAlign: 'center' }}>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#faf9f8', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Montserrat, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Topbar: Τίτλος & Αναζήτηση */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: COLORS.dark, margin: 0 }}>ΕΚΔΗΛΩΣΕΙΣ</h1>
          <div style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '280px', maxWidth: '500px' }}>
            <input 
              type="text" 
              placeholder="Αναζήτηση τίτλου ή περιγραφής..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ flex: 1, padding: '12px', border: `1px solid ${COLORS.border}`, borderRadius: '1px', fontSize: '14px', outline: 'none', backgroundColor: COLORS.white }}
            />
          </div>
        </div>

        {/* Filters Select Rows */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '25px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: COLORS.textMuted }}>Φίλτρα:</span>
          
          <select 
            value={selectedCity} 
            onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '1px', backgroundColor: COLORS.white, cursor: 'pointer', fontSize: '13px' }}
          >
            <option value="">Πόλη (όλες)</option>
            <option value="Αθήνα">Αθήνα</option>
            <option value="Θεσσαλονίκη">Θεσσαλονίκη</option>
            <option value="Πάτρα">Πάτρα</option>
            <option value="Ηράκλειο">Ηράκλειο</option>
            <option value="Λάρισα">Λάρισα</option>
            <option value="Βόλος">Βόλος</option>
            <option value="Ιωάννινα">Ιωάννινα</option>
            <option value="Χανιά">Χανιά</option>
            <option value="Ρόδος">Ρόδος</option>
            <option value="Καβάλα">Καβάλα</option>
            <option value="Σέρρες">Σέρρες</option>
            <option value="Αλεξανδρούπολη">Αλεξανδρούπολη</option>
            <option value="Τρίκαλα">Τρίκαλα</option>
            <option value="Πρέβεζα">Πρέβεζα</option>
            <option value="Ηγουμενίτσα">Ηγουμενίτσα</option>
            <option value="Καλαμάτα">Καλαμάτα</option>
            <option value="Χαλκίδα">Χαλκίδα</option>
            <option value="Λαμία">Λαμία</option>
            <option value="Κομοτηνή">Κομοτηνή</option>
            <option value="Κέρκυρα">Κέρκυρα</option>
            <option value="Μυτιλήνη">Μυτιλήνη</option>
            <option value="Κοζάνη">Κοζάνη</option>
            <option value="Αγρίνιο">Αγρίνιο</option>
            <option value="Βέροια">Βέροια</option>
            <option value="Δράμα">Δράμα</option>
            <option value="Αμφιλοχία">Αμφιλοχία</option>
            <option value="Ξάνθη">Ξάνθη</option>
            <option value="Κιλκίς">Κιλκίς</option>
            <option value="Φλώρινα">Φλώρινα</option>
            <option value="Σπάρτη">Σπάρτη</option>
            <option value="Ναύπλιο">Ναύπλιο</option>
            <option value="Άργος">Άργος</option>
            <option value="Κόρινθος">Κόρινθος</option>
          </select>

          <select 
            value={selectedPrice} 
            onChange={(e) => { setSelectedPrice(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '1px', backgroundColor: COLORS.white, cursor: 'pointer', fontSize: '13px' }}
          >
            <option value="">Τιμή (όλες)</option>
            <option value="0-15">0–15€</option>
            <option value="15-30">15–30€</option>
            <option value="30+">30€+</option>
          </select>

          <select 
            value={selectedSort} 
            onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '1px', backgroundColor: COLORS.white, cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}
          >
            <option value="date">Ταξινόμηση: Ημερομηνία</option>
            <option value="price_asc">Τιμή (αύξουσα)</option>
            <option value="price_desc">Τιμή (φθίνουσα)</option>
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '25px' }}>
          <button 
            onClick={() => { setActiveCat(null); setCurrentPage(1); }}
            style={{
              padding: '8px 20px', borderRadius: '1px', border: `1px solid ${!activeCat ? COLORS.primary : COLORS.border}`,
              backgroundColor: !activeCat ? COLORS.primary : COLORS.white, color: 'black',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px'
            }}
          >
            ΟΛΕΣ
          </button>
          {CATS.map(cat => (
            <button 
              key={cat}
              onClick={() => { setActiveCat(cat); setCurrentPage(1); }}
              style={{
                padding: '8px 20px', borderRadius: '1px', border: `1px solid ${activeCat === cat ? COLORS.primary : COLORS.border}`,
                backgroundColor: activeCat === cat ? COLORS.primary : COLORS.white, color: 'black',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer', letterSpacing: '1px'
              }}
            >
              {cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Results Count Info */}
        <div style={{ fontSize: '14px', color: COLORS.textMuted, marginBottom: '20px', fontStyle: 'italic' }}>
          {totalEvents} εκδηλώσεις 
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
              const eventCats = event.cats || event.categories || [];

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
                  {/* Card Header (Icon & Status) */}
                  <div style={{ height: '140px', backgroundColor: COLORS.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative' }}>
                    {event.icon || '📅'}
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
                        onClick={(e) => handleBookEvent(e, event.id)}
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
                        {isAvailable ? 'ΚΡΑΤΗΣΗ' : 'ΜΗ ΔΙΑΘΕΣΙΜΟ'}
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