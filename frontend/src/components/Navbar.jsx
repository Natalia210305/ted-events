import React, { useState, useEffect } from 'react'; // Πρόσθεσε το useEffect
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api'; // Βεβαιώσου ότι το path για το api service είναι σωστό

const COLORS = {
  primary: '#d2b893',      // Το μπεζ/χρυσό
  dark: '#2c2c2c',         // Σκούρο γκρι/μαύρο
  textMuted: '#555555',    // Απαλό γκρι
  bgLight: '#f9f7f5',      // Ανοιχτό φόντο
  border: '#e4dfda',       // Απαλό border
  white: '#ffffff',
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const storedUser = localStorage.getItem('user');
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      
      if (!userObj) return;

      try {
        const response = await api.get('/messages/unread-count');
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Error fetching unread count", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);
  // Απόκρυψη στην αρχική σελίδα
  if (location.pathname === '/') {
    return null;
  }

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user ? user.role : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDropdownOpen(false);
    navigate('/');
  };

  // Βοηθητική συνάρτηση για δυναμικό στυλ στο ενεργό Link (Υπογράμμιση)
  const getActiveStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      ...linkStyle,
      color: isActive ? COLORS.primary : COLORS.dark,
      borderBottom: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
      paddingBottom: '5px', // Δημιουργεί χώρο ανάμεσα στο κείμενο και την υπογράμμιση
    };
  };

  const profileDropdownItems = [
    { title: "ΤΟ ΠΡΟΦΙΛ ΜΟΥ", path: "/profile", desc: "Δείτε και επεξεργαστείτε τα στοιχεία soaps", icon: "👤" },
    { title: "ΡΥΘΜΙΣΕΙΣ", path: "/settings", desc: "Διαχειριστείτε τον λογαριασμό σας", icon: "⚙️" },
  ];

  return (
    <nav style={navStyle}>

      {/* ─── LOGO ─── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        {/* Το νέο σου Logo Image */}
        <img 
          src="/logo.png" 
          alt="EventQ Logo" 
          style={{ 
            width: '150px',       // Ρυθμίζεις το πλάτος ανάλογα με το πώς σου κάθεται στο μάτι
            height: '150px',      // Ρυθμίζεις το ύψος
            objectFit: 'contain' // Κρατάει τις αναλογίες της εικόνας χωρίς να την παραμορφώνει
          }} 
        />
      </Link>

      {/* ─── ΔΥΝΑΜΙΚΟ LINKS AREA ─── */} 
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        
        {/* Κοινό μενού για όλους εκτός Admin */}
        {role !== 'ADMIN' && (
          <>
            <Link to="/" style={getActiveStyle('/')}>ΑΡΧΙΚΗ</Link>
            <Link to="/events" style={getActiveStyle('/events')}>ΠΕΡΙΗΓΗΣΗ ΣΕ ΕΚΔΗΛΩΣΕΙΣ</Link>
          </>
        )}

        {/* Μενού για ADMIN */}
        {role === 'ADMIN' && (
          <>
            <Link to="/admin/users" style={getActiveStyle('/admin/users')}>ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ</Link>
            <Link to="/admin/export" style={getActiveStyle('/admin/export')}>ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ</Link>
          </>
        )}

        {/* Μενού για ORGANIZER */}
        {role === 'ORGANIZER' && (
          <>
            <div style={dividerStyle} />
            <Link to="/my-events" style={getActiveStyle('/my-events')}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</Link>
          </>
        )}

        {/* Το βλέπουν όλοι εκτός από τον Admin (που συνήθως δεν κάνει κρατήσεις) */}
        {user && role !== 'ADMIN' && (
          <>
            <div style={dividerStyle} />
            <Link to="/my-bookings" style={getActiveStyle('/my-bookings')}>ΙΣΤΟΡΙΚΟ</Link>
          </>
        )}

        {user && role !== 'ADMIN' && (
          <>
            {/* ΑΝΤΙΚΑΤΑΣΤΑΣΗ ΕΔΩ */}
            <Link to="/messages" style={iconLinkStyle} title="Messages">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                💬
                {unreadCount > 0 && (
                  <span style={badgeStyle}>{unreadCount}</span>
                )}
              </div>
            </Link>
            
            <Link to="/notifications" style={{ ...iconLinkStyle, color: location.pathname === '/notifications' ? COLORS.primary : COLORS.dark }} title="Notifications">🔔</Link>
          </>
        )}

        {/* Dropdown Προφίλ */}
        {user && (
          <div 
            style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <span style={{ 
              ...linkStyle, 
              color: isDropdownOpen || ['/profile', '/settings'].includes(location.pathname) ? COLORS.primary : COLORS.dark, 
              cursor: 'pointer',
              borderBottom: ['/profile', '/settings'].includes(location.pathname) ? `3px solid ${COLORS.primary}` : '3px solid transparent',
              paddingBottom: '5px'
            }}>
              ΠΡΟΦΙΛ <span style={{ fontSize: '0.8rem' }}>▼</span>
            </span>

            {isDropdownOpen && (
              <div style={dropdownWrapper}>
                <div style={dropdownCard}>
                  {profileDropdownItems.map((item, index) => (
                    <Link 
                      key={index} 
                      to={item.path} 
                      style={dropdownItem} 
                      onClick={() => setIsDropdownOpen(false)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgLight}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ ...iconBox, color: COLORS.dark }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ ...itemTitle, color: COLORS.dark }}>{item.title}</div>
                        <div style={itemDesc}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                  
                  <div 
                    style={dropdownItem} 
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ ...iconBox, color: '#791F1F' }}>🚪</div>
                    <div>
                      <div style={{ ...itemTitle, color: '#791F1F' }}>ΑΠΟΣΥΝΔΕΣΗ</div>
                      <div style={itemDesc}>Έξοδος από την εφαρμογή</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {role === 'ORGANIZER' && (
          <button 
            onClick={() => navigate('/create-event')} 
            style={createButtonStyle}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            + ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ
          </button>
        )}
      </div>
    </nav>
  );
}

// ─── STYLES ───
const navStyle = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  padding: '0 6%', 
  height: '90px', 
  background: COLORS.white, 
  boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 2000,
  fontFamily: 'Montserrat, sans-serif'
};

const linkStyle = {
  textDecoration: 'none',
  fontSize: '1.05rem',
  fontWeight: '600',
  transition: 'color 0.2s, border-color 0.2s',
  cursor: 'pointer'
};

const badgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  backgroundColor: '#ff4d4f', // Κόκκινο "alert"
  color: 'white',
  borderRadius: '50%',
  padding: '2px 6px',
  fontSize: '10px',
  fontWeight: 'bold',
  border: '2px solid white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  height: '18px'
};

const iconLinkStyle = {
  textDecoration: 'none',
  fontSize: '1.3rem',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const dividerStyle = {
  width: '1px',
  height: '25px',
  backgroundColor: COLORS.border,
};

const dropdownWrapper = {
  position: 'absolute',
  top: '80px',
  right: '0px', 
  paddingTop: '15px', 
  zIndex: 2100,
};

const dropdownCard = {
  width: '360px',
  backgroundColor: COLORS.white,
  borderRadius: '20px',
  boxShadow: '0 15px 50px rgba(0,0,0,0.12)',
  padding: '15px',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  border: `1px solid ${COLORS.border}`,
};

const dropdownItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  padding: '12px',
  textDecoration: 'none',
  borderRadius: '12px',
  transition: '0.2s',
  cursor: 'pointer',
};

const iconBox = {
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: '1.3rem',
  backgroundColor: COLORS.bgLight,
  borderRadius: '10px'
};

const itemTitle = {
  fontWeight: '700',
  fontSize: '1rem',
  marginBottom: '2px'
};

const itemDesc = {
  color: COLORS.textMuted,
  fontSize: '0.85rem',
  lineHeight: '1.3'
};

const createButtonStyle = {
  padding: '12px 25px',
  borderRadius: '50px',
  border: 'none',
  background: COLORS.primary,
  color: COLORS.dark,
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: `0 4px 15px rgba(210, 184, 147, 0.25)`,
  transition: '0.3s',
  fontFamily: 'Montserrat, sans-serif',
};

export default Navbar;