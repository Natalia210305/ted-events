import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; 

const PER_PAGE = 6;

// Παλέτα χρωμάτων
const COLORS = {
  primary: '#d2b893',      
  dark: '#2c2c2c',         
  textMuted: '#555555',    
  bgLight: '#f9f7f5',      
  border: '#e4dfda',       
  white: '#ffffff',
  cancelledBg: '#FCEBEB',
  cancelledText: '#791F1F',
  publishedBg: '#EAF3DE',
  publishedText: '#27500A'
};

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

export default function EventsBrowse() {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [recommendations, setRecommendations] = useState([]);
  const [isRecsActive, setIsRecsActive] = useState(false); 

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedSort, setSelectedSort] = useState('date');
  const [activeCat, setActiveCat] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  useEffect(() => {
    const fetchEventsFromBackend = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/events', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Αποτυχία ανάκτησης δεδομένων από τον server.');
        }

        const data = await response.json();
        const now = new Date();

        const mapped = data
          .filter(e => new Date(e.endDateTime) > now && e.status === 'PUBLISHED')
          .map(e => {
            const processedCats = (e.categories || []).map(c => {
              const nameStr = c && typeof c === 'object' ? (c.name || '') : c;
              const clean = nameStr.toString().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
              
              if (clean === 'MUSIC' || clean === 'ΜΟΥΣΙΚΗ') return 'ΜΟΥΣΙΚΗ';
              if (clean === 'CINEMA' || clean === 'ΤΑΙΝΙΕΣ' || clean === 'ΣΙΝΕΜΑ') return 'ΣΙΝΕΜΑ';
              return clean;
            });

            return {
              ...e,
              desc: e.description,
              cats: processedCats, 
              start: e.startDateTime,
              available: (e.ticketTypes || []).reduce((sum, t) => sum + t.available, 0),
              minPrice: e.ticketTypes?.length > 0 ? Math.min(...e.ticketTypes.map(t => t.price)) : 0,
            };
          });
          
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
  
  useEffect(() => {
    if (user) {
      api.get(`/events/recommendations?userId=${user.id || user.user_id}`)
        .then(res => {
          const recIds = res.data.map(item => item.id || item.event_id);
          setRecommendations(recIds);
        })
        .catch(err => {
          console.error("Error loading recommendations:", err);
        });
    }
  }, []);
  const CATS = [...new Set(events.flatMap(e => e.cats || []))].sort();

  const handleViewEvent = (id) => { navigate(`/events/${id}`); };
  const handleBookEvent = (e, id) => { e.stopPropagation(); navigate(`/events/${id}`); };

  const filteredEvents = events.filter(event => {
    const eventId = event.id || event.EventID;

    if (isRecsActive && !recommendations.includes(eventId)) {
      return false;
    }

    const eventCats = event.cats || [];
    if (activeCat && !eventCats.includes(activeCat)) return false;

    if (selectedCity) {
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

    const eventDate = new Date(event.start || event.startDateTime);
    if (startDate && eventDate < new Date(startDate)) return false;
    if (endDate) {
      const endCondition = new Date(endDate);
      endCondition.setHours(23, 59, 59, 999);
      if (eventDate > endCondition) return false;
    }

    return true;
  }).sort((a, b) => {
    if (selectedSort === 'price_asc') return a.minPrice - b.minPrice;
    if (selectedSort === 'price_desc') return b.minPrice - a.minPrice;
    return new Date(a.start || a.startDateTime) - new Date(b.start || b.startDateTime);
  });

  const totalEvents = filteredEvents.length;
  const totalPages = Math.ceil(totalEvents / PER_PAGE);
  const validCurrentPage = currentPage > totalPages ? 1 : currentPage;
  const startIndex = (validCurrentPage - 1) * PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + PER_PAGE);

  const formatDate = (str) => {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

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
        
        {/* ─── TOPBAR ─── */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '30px',              
          marginBottom: '50px' 
        }}>
          
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          width: '100%',
          position: 'relative'
        }}>
          <div style={{ width: '160px', display: 'block' }} className="nav-spacer" />

          <div style={{ textAlign: 'center', flex: 1 }}>
            <h1 style={{ fontWeight: '800', fontSize: '2.2rem', letterSpacing: '1px', color: '#2c2c2c', margin: 0 }}>
              ΕΚΔΗΛΩΣΕΙΣ
            </h1>
            <div style={{ width: '80px', height: '4px', backgroundColor: '#d2b893', marginTop: '10px', marginLeft: 'auto', marginRight: 'auto' }} />
          </div>

          <div style={{ width: '160px', display: 'flex', justifyContent: 'flex-end' }}>
            {JSON.parse(localStorage.getItem('user'))?.role?.toUpperCase() === 'ORGANIZER' && (
              <button
                onClick={() => navigate('/create-event')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#d2b893',
                  color: '#2c2c2c',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(210,184,147,0.2)',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Poppins, sans-serif'
                }}
              >
                + ΝΕΑ ΕΚΔΗΛΩΣΗ
              </button>
            )}
          </div>
        </div>

          <div style={{ 
            width: '100%', 
            maxWidth: '700px', 
            position: 'relative' 
          }}>
            <img 
              src="search.png" 
              alt="search" 
              style={{
                position: 'absolute',
                left: '20px',        
                top: '50%',         
                transform: 'translateY(-50%)',
                width: '20px',        
                height: '20px',
                opacity: '0.5',     
                pointerEvents: 'none' 
              }} 
            />

            <input 
              type="text" 
              placeholder="Αναζήτηση τίτλου ή περιγραφής..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ 
                width: '100%', 
                padding: '16px 25px 16px 55px', 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: '30px',  
                fontSize: '16px', 
                outline: 'none', 
                backgroundColor: COLORS.white,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(210, 184, 147, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
              }}
            />
          </div>

        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '35px', backgroundColor: COLORS.white, padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: COLORS.dark, letterSpacing: '1px', textTransform: 'uppercase' }}>Φιλτρα:</span>
          
          <select 
            value={selectedCity} 
            onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark }}
          >
            <option value=""> Πόλη (όλες)</option>
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
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark }}
          >
            <option value="">Τιμή (όλες)</option>
            <option value="0-15">0–15€</option>
            <option value="15-30">15–30€</option>
            <option value="30+">30€+</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', padding: '10px 16px', backgroundColor: '#fcfbfa' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#888' }}>ΑΠΟ:</span>
            <input 
              type="text"                       
              placeholder="--"                
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              onFocus={(e) => e.target.type = 'date'} 
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} 
              style={{ 
                border: 'none', 
                backgroundColor: 'transparent', 
                fontSize: '13px', 
                fontFamily: 'Poppins, sans-serif', 
                outline: 'none', 
                color: COLORS.dark, 
                cursor: 'pointer',
                width: '100px'                
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', padding: '10px 16px', backgroundColor: '#fcfbfa' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#888' }}>ΕΩΣ:</span>
            <input 
              type="text"                       
              placeholder="--"                  
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              onFocus={(e) => e.target.type = 'date'}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }} 
              style={{ 
                border: 'none', 
                backgroundColor: 'transparent', 
                fontSize: '13px', 
                fontFamily: 'Poppins, sans-serif', 
                outline: 'none', 
                color: COLORS.dark, 
                cursor: 'pointer',
                width: '100px'               
              }}
            />
          </div>

          <select 
            value={selectedSort} 
            onChange={(e) => { setSelectedSort(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 16px', border: `1px solid ${COLORS.border}`, borderRadius: '30px', backgroundColor: '#fcfbfa', cursor: 'pointer', fontSize: '12px', fontFamily: 'Poppins, sans-serif', fontWeight: '600', outline: 'none', color: COLORS.dark, marginLeft: 'auto' }}
          >
            <option value="date">Ταξινόμηση: Ημερομηνία</option>
            <option value="price_asc">Τιμή (αύξουσα)</option>
            <option value="price_desc">Τιμή (φθίνουσα)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '15px', marginBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          
          <button 
            onClick={() => { setIsRecsActive(false); setActiveCat(null); setCurrentPage(1); }}
            style={{
              padding: '10px 24px', borderRadius: '50px', 
              backgroundColor: (!activeCat && !isRecsActive) ? COLORS.primary : COLORS.white, 
              color: 'black', border: (!activeCat && !isRecsActive) ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
              boxShadow: (!activeCat && !isRecsActive) ? '0 4px 15px rgba(210, 184, 147, 0.3)' : 'none',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s ease', fontFamily: 'Poppins, sans-serif'
            }}
          >
            ΟΛΕΣ
          </button>

          {user?.role?.toUpperCase() === 'ATTENDEE' && (
            <button 
              onClick={() => { setIsRecsActive(true); setActiveCat(null); setCurrentPage(1); }}
              style={{
                padding: '10px 24px', borderRadius: '50px', 
                backgroundColor: isRecsActive ? COLORS.primary : COLORS.white, 
                color: 'black', border: isRecsActive ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                boxShadow: isRecsActive ? '0 4px 15px rgba(210, 184, 147, 0.3)' : 'none',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s ease', fontFamily: 'Poppins, sans-serif'
              }}
            >
              <img 
                src="/star (1).png" 
                alt="Party Icon" 
                style={{ width: '12px', height: '12px', objectFit: 'contain', marginRight: '8px' }} 
              />
              ΠΡΟΤΕΙΝΟΜΕΝΑ ΓΙΑ ΕΣΑΣ
            </button>
          )}

          {CATS.map(cat => {
            const isActive = activeCat === cat && !isRecsActive;
            return (
              <button 
                key={cat}
                onClick={() => { setIsRecsActive(false); setActiveCat(cat); setCurrentPage(1); }}
                style={{
                  padding: '10px 24px', borderRadius: '50px', 
                  backgroundColor: isActive ? COLORS.primary : COLORS.white, color: 'black',
                  border: isActive ? `1px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  boxShadow: isActive ? '0 4px 15px rgba(210, 184, 147, 0.3)' : 'none',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s ease', fontFamily: 'Poppins, sans-serif'
                }}
                onMouseEnter={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = COLORS.bgLight; }}
                onMouseLeave={(e) => { if(!isActive) e.currentTarget.style.backgroundColor = COLORS.white; }}
              >
                {cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: '13px', color: COLORS.textMuted, marginBottom: '25px', fontWeight: '600', letterSpacing: '0.5px' }}>
          Βρέθηκαν {totalEvents} εκδηλώσεις {isRecsActive && "βάσει των ενδιαφερόντων σας"}
        </div>

        {paginatedEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: `1px dashed ${COLORS.border}`, color: COLORS.textMuted, backgroundColor: COLORS.white, borderRadius: '15px' }}>
            {isRecsActive 
              ? 'Δεν υπάρχουν ακόμα αρκετά δεδομένα κρατήσεων για να εμφανιστούν εξατομικευμένες προτάσεις.' 
              : 'Δεν βρέθηκαν εκδηλώσεις που να ταιριάζουν με τα κριτήρια.'}
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
                    backgroundColor: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: '15px',
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
                  <div style={{ width: '100%', height: '160px', overflow: 'hidden', position: 'relative' }}>
                    <img src={getEventImage(event.eventType, event.title)} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{
                      position: 'absolute', top: '12px', right: '12px', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '15px', letterSpacing: '1px',
                      backgroundColor: isCancelled ? COLORS.cancelledBg : COLORS.publishedBg, color: isCancelled ? COLORS.cancelledText : COLORS.publishedText
                    }}>
                      {isCancelled ? 'ΑΚΥΡΩΜΕΝΗ' : 'ΔΗΜΟΣΙΕΥΜΕΝΗ'}
                    </span>
                  </div>

                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {eventCats.map(c => (
                        <span key={c} style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: COLORS.bgLight, color: COLORS.dark, border: `1px solid ${COLORS.border}`, borderRadius: '5px', fontWeight: '600' }}>
                          {c}
                        </span>
                      ))}
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: COLORS.dark, marginBottom: '12px', lineHeight: '1.4' }}>{event.title}</h3>

                    <div style={{ fontSize: '13.5px', color: COLORS.textMuted, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="calendar (1).png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} /> {formatDate(event.start || event.startDateTime)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><img src="pin.png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} /> {event.venue || event.Venue}, {event.city || event.City}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="team.png" alt="" style={{ width: '19px', height: '19px', objectFit: 'contain', flexShrink: 0}} /> 
                        {event.available === 0 ? <span style={{ color: COLORS.cancelledText, fontWeight: '700' }}>Εξαντλήθηκε</span> : <span>{event.available} θέσεις διαθέσιμες</span>}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: `1px solid ${COLORS.bgLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Τιμη απο</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: COLORS.dark }}>{event.minPrice === 0 ? 'Δωρεάν' : `${event.minPrice}€`}</div>
                      </div>
                      <button 
                        disabled={!isAvailable}
                        onClick={(e) => handleBookEvent(e, event.id || event.EventID)}
                        style={{
                          padding: '10px 20px', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', border: 'none', borderRadius: '5px',
                          backgroundColor: isAvailable ? COLORS.primary : '#e0e0e0', color: isAvailable ? 'black' : '#888888', cursor: isAvailable ? 'pointer' : 'not-allowed', transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => { if(isAvailable) e.currentTarget.style.backgroundColor = '#c4aa82'; }}
                        onMouseLeave={(e) => { if(isAvailable) e.currentTarget.style.backgroundColor = COLORS.primary; }}
                      >
                        {isAvailable 
                          ? (JSON.parse(localStorage.getItem('user'))?.role?.toUpperCase() === 'ATTENDEE' ? 'ΚΡΑΤΗΣΗ / ΠΕΡΙΣΣΟΤΕΡΑ' : 'ΠΕΡΙΣΣΟΤΕΡΑ') 
                          : 'ΜΗ ΔΙΑΘΕΣΙΜΟ'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '40px' }}>

            {/* Προηγούμενο */}
            <button
              onClick={() => { setCurrentPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={validCurrentPage === 1}
              style={{
                padding: '10px 16px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
                border: `1px solid ${COLORS.border}`,
                backgroundColor: validCurrentPage === 1 ? '#f0f0f0' : COLORS.white,
                color: validCurrentPage === 1 ? '#bbb' : COLORS.dark,
                fontWeight: '600', fontSize: '13px',
                cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '6px', fontFamily: 'Poppins, sans-serif'
              }}
            > <img 
                src="/arrow (2).png" 
                alt="Προηγούμενο" 
                style={{ 
                  height: '20px', 
                  width: '13px', 
                  objectFit: 'contain',
                  opacity: validCurrentPage === 1 ? 0.3 : 1 
                }} 
              />
              Προηγούμενο                
            </button>

            {/* Αριθμοί με "..." */}
            {(() => {
              const pages = [];
              const rangeStart = Math.max(2, validCurrentPage - 2);
              const rangeEnd = Math.min(totalPages - 1, validCurrentPage + 2);

              pages.push(1);
              if (rangeStart > 2) pages.push('...');
              for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
              if (rangeEnd < totalPages - 1) pages.push('...');
              if (totalPages > 1) pages.push(totalPages);

              return pages.map((page, idx) => {
                if (page === '...') {
                  return <span key={`dots-${idx}`} style={{ width: '40px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>...</span>;
                }
                const isActive = validCurrentPage === page;
                return (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${isActive ? COLORS.primary : COLORS.border}`,
                      backgroundColor: isActive ? COLORS.primary : COLORS.white,
                      color: 'black', fontWeight: '600', fontSize: '14px',
                      cursor: 'pointer', borderRadius: '6px', fontFamily: 'Poppins, sans-serif'
                    }}
                  >
                    {page}
                  </button>
                );
              });
            })()}
            <button
              onClick={() => { setCurrentPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={validCurrentPage === totalPages}
              style={{
                padding: '10px 16px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
                border: `1px solid ${COLORS.border}`,
                backgroundColor: validCurrentPage === totalPages ? '#f0f0f0' : COLORS.white,
                color: validCurrentPage === totalPages ? '#bbb' : COLORS.dark,
                fontWeight: '600', fontSize: '13px',
                cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '6px', fontFamily: 'Poppins, sans-serif'
              }}
            > 
              Επόμενο
              <img 
                src="/right-arrow.png" 
                alt="Επόμενο" 
                style={{ 
                  height: '20px', 
                  width: '13px', 
                  objectFit: 'contain',
                  opacity: validCurrentPage === totalPages ? 0.3 : 1 
                }} 
              />
            </button>

          </div>
        )}
      </div>
    </div>
  );
}