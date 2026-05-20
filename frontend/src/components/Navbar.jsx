import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api'; 

const COLORS = {
  primary: '#d2b893',      // Premium Μπεζ/Χρυσό
  dark: '#2c2c2c',         // Soft Charcoal (Ανθρακί)
  textMuted: '#666666',    
  bgLight: '#fbf9f6',      // Warm Minimalist φόντο (Ivory/Ελεφαντόδοντο)
  border: '#e4dfda',       
  white: '#ffffff',
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchUnreadData = async () => {
      const storedUser = localStorage.getItem('user');
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      
      if (!userObj) return;

      try {
        const msgResponse = await api.get('/messages/unread-count');
        setUnreadCount(msgResponse.data.unreadCount);

        const notifResponse = await api.get('/notifications');
        const unreadNotifs = notifResponse.data.filter(n => n.isRead === false || !n.isRead).length;
        setUnreadNotificationsCount(unreadNotifs);
      } catch (error) {
        console.error("Error fetching unread counts", error);
      }
    };

    fetchUnreadData();
    const interval = setInterval(fetchUnreadData, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  if (location.pathname === '/') {
    return null;
  }

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  
  // Δικλείδα ασφαλείας: Μετατρέπουμε τον ρόλο πάντα σε ΚΕΦΑΛΑΙΑ για να μην σπάει αν στη βάση είναι πεζά
  const role = user && user.role ? user.role.toUpperCase() : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDropdownOpen(false);
    navigate('/');
  };

  const getActiveStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      ...linkStyle,
      color: isActive ? COLORS.primary : COLORS.dark,
      borderBottom: isActive ? `3px solid ${COLORS.primary}` : '3px solid transparent',
      paddingBottom: '8px', 
    };
  };

  const profileDropdownItems = [
    { title: "ΤΟ ΠΡΟΦΙΛ ΜΟΥ", path: "/profile", desc: "Δείτε και επεξεργαστείτε τα στοιχεία σας", icon: "👤" },
    { title: "ΡΥΘΜΙΣΕΙΣ", path: "/settings", desc: "Διαχειριστείτε τον λογαριασμό σας", icon: "⚙️" },
  ];

return (
    <nav style={navStyle}>
      
      {/* ─── 1. ΑΡΙΣΤΕΡΑ: LOGO ─── */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img 
            src="/logo.png" 
            alt="EventQ Logo" 
            style={{ width: '130px', height: '70px', objectFit: 'contain' }} 
          />
        </Link>
      </div>

      {/* ─── 2. ΚΕΝΤΡΟ: LINKS AREA (Καθαρό μενού) ─── */} 
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flex: 1, 
        gap: '40px',
        padding: '0 20px'
      }}>
        
        {/* Σελίδες για απλούς Χρήστες / Διοργανωτές */}
        {role !== 'ADMIN' && (
          <Link to="/events" style={getActiveStyle('/events')}>ΠΕΡΙΗΓΗΣΗ ΣΕ ΕΚΔΗΛΩΣΕΙΣ</Link>
        )}

        {/* Σελίδες αποκλειστικά για τον ADMIN */}
        {role === 'ADMIN' && (
          <>
            <Link to="/admin/users" style={getActiveStyle('/admin/users')}>👥 ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ</Link>
            <div style={dividerStyle} /> {/* <-- Η ΚΑΘΕΤΗ ΓΡΑΜΜΗ ΜΠΗΚΕ ΕΔΩ */}
            <Link to="/admin/export" style={getActiveStyle('/admin/export')}>📦 ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ</Link>
          </>
        )}

        {/* Επιλογές Διοργανωτή */}
        {role === 'ORGANIZER' && (
          <>
            <div style={dividerStyle} />
            <Link to="/my-events" style={getActiveStyle('/my-events')}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</Link>
          </>
        )}

        {/* Ιστορικό Κρατήσεων */}
        {user && role !== 'ADMIN' && (
          <>
            <div style={dividerStyle} />
            <Link to="/my-bookings" style={getActiveStyle('/my-bookings')}>ΙΣΤΟΡΙΚΟ</Link>
          </>
        )}

        {/* Εικονίδια Μηνυμάτων & Ειδοποιήσεων */}
        {user && role !== 'ADMIN' && (
          <>
            <Link to="/messages" style={iconLinkStyle} title="Messages">
              <div style={{ 
                position: 'relative', 
                display: 'inline-flex', 
                alignItems: 'center',
                transform: 'translateY(-3px)', 
                transition: '0.2s' 
              }}>
                💬
                {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
              </div>
            </Link>
            
            <Link 
              to="/notifications" 
              style={{ ...iconLinkStyle, color: location.pathname === '/notifications' ? COLORS.primary : COLORS.dark }} 
              title="Notifications"
            >
              <div style={{ 
                position: 'relative', 
                display: 'inline-flex', 
                alignItems: 'center',
                transform: 'translateY(-3px)' 
              }}>
                🔔
                {unreadNotificationsCount > 0 && <span style={badgeStyle}>{unreadNotificationsCount}</span>}
              </div>
            </Link>
          </>
        )}
      </div>

      {/* ─── 3. ΔΕΞΙΑ: USER AREA (Κουμπί νέας εκδήλωσης + Εικονίδιο Προφίλ τέρμα δεξιά) ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
        
        {/* Το κουμπί «+ ΝΕΑ ΕΚΔΗΛΩΣΗ» μπήκε ΠΡΙΝ το προφίλ για να κάθεται δίπλα στα εικονίδια */}
        {role === 'ORGANIZER' && (
          <button 
            onClick={() => navigate('/create-event')} 
            style={createButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(210, 184, 147, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(210, 184, 147, 0.2)';
            }}
          >
            + ΝΕΑ ΕΚΔΗΛΩΣΗ
          </button>
        )}

        {/* Dropdown με εικονίδιο 👤 αντί για κείμενο και βέλος */}
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
              paddingBottom: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem', // Μεγαλώνουμε λίγο το μέγεθος για να φαίνεται ωραίο το emoji 👤
              whiteSpace: 'nowrap'
            }}>
              <span style={{ fontSize: '1rem' }}>👤</span> ΠΡΟΦΙΛ
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
                      <div style={iconBox}>{item.icon}</div>
                      <div>
                        <div style={{ ...itemTitle, color: COLORS.dark }}>{item.title}</div>
                        <div style={itemDesc}>{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                  
                  <div style={dropdownDivider} />

                  <div 
                    style={dropdownItem} 
                    onClick={handleLogout}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ ...iconBox, backgroundColor: '#ffebee', color: '#cb2d3e' }}>🚪</div>
                    <div>
                      <div style={{ ...itemTitle, color: '#cb2d3e' }}>ΑΠΟΣΥΝΔΕΣΗ</div>
                      <div style={itemDesc}>Έξοδος από την εφαρμογή</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </nav>
  );
}

// ─── PREMIUM SOFT UI STYLES ───
const navStyle = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  padding: '0 24px', // <-- ΑΛΛΑΓΗ ΕΔΩ: Μειώνουμε το padding για να απλωθεί στις άκρες
  height: '90px', 
  background: COLORS.white, 
  boxShadow: '0 4px 25px rgba(0,0,0,0.03)', 
  position: 'sticky',
  top: 0,
  zIndex: 2000,
  fontFamily: 'Montserrat, sans-serif'
};

const linkStyle = {
  textDecoration: 'none',
  fontSize: '0.95rem',
  fontWeight: '700',
  letterSpacing: '1px',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
};

const badgeStyle = {
  position: 'absolute',
  top: '-6px',
  right: '-6px',
  backgroundColor: '#cb2d3e', 
  color: 'white',
  borderRadius: '50%',
  fontSize: '9px',
  fontWeight: 'bold',
  border: '2px solid white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '16px',
  height: '16px'
};

const iconLinkStyle = {
  textDecoration: 'none',
  fontSize: '1.25rem',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const dividerStyle = {
  width: '1px',
  height: '20px',
  backgroundColor: COLORS.border,
};

const dropdownWrapper = {
  position: 'absolute',
  top: '85px',
  right: '0px', 
  paddingTop: '10px', 
  zIndex: 2100,
};

const dropdownCard = {
  width: '320px',
  backgroundColor: COLORS.white,
  borderRadius: '16px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08)', // Soft εφέ βάθους
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  border: `1px solid ${COLORS.border}`,
};

const dropdownItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px',
  textDecoration: 'none',
  borderRadius: '10px',
  transition: 'all 0.2s',
  cursor: 'pointer',
};

const iconBox = {
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: '1.1rem',
  backgroundColor: COLORS.bgLight,
  borderRadius: '8px'
};

const itemTitle = {
  fontWeight: '700',
  fontSize: '0.9rem',
  marginBottom: '1px',
  letterSpacing: '0.5px'
};

const itemDesc = {
  color: '#888888',
  fontSize: '0.78rem',
  lineHeight: '1.2'
};

const dropdownDivider = {
  height: '1px',
  backgroundColor: COLORS.border,
  margin: '6px 0'
};

const createButtonStyle = {
  padding: '10px 22px',
  borderRadius: '50px',
  border: 'none',
  background: COLORS.primary,
  color: COLORS.dark,
  fontSize: '0.85rem',
  fontWeight: '700',
  letterSpacing: '0.5px',
  cursor: 'pointer',
  boxShadow: `0 4px 15px rgba(210, 184, 147, 0.2)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'Montserrat, sans-serif',
};

export default Navbar;