import React, { useState, useEffect } from 'react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api'; 

const COLORS = {
  primary: '#d2b893',      // Το μπεζ/χρυσό
  dark: '#2c2c2c',         // Σκούρο γκρι/μαύρο
  textMuted: '#555555',    // Απαλό γκρι
  bgLight: '#f9f7f5',      // Ανοιχτό φόντο
  border: '#e4dfda',       // Απαλό border
  white: '#ffffff',
  darkbrown: '#884834'
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 1. ΝΕΟ STATE ΓΙΑ ΤΙΣ ΕΙΔΟΠΟΙΗΣΕΙΣ
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchUnreadData = async () => {
      const storedUser = localStorage.getItem('user');
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      
      if (!userObj) return;

      try {
        // Κλήση Α: Για τον αριθμό των αδιάβαστων μηνυμάτων
        const msgResponse = await api.get('/messages/unread-count');
        setUnreadCount(msgResponse.data.unreadCount);

        // Κλήση Β: Για τις ειδοποιήσεις (Φέρνουμε όλες και φιλτράρουμε τις unread)
        const notifResponse = await api.get('/notifications');
        const unreadNotifs = notifResponse.data.filter(n => n.isRead === false || !n.isRead).length;
        setUnreadNotificationsCount(unreadNotifs);

      } catch (error) {
        console.error("Error fetching unread counts", error);
      }
    };

    fetchUnreadData();
    // Μειώνουμε το χρόνο σε 10 δευτερόλεπτα για να ενημερώνεται πιο γρήγορα το καμπανάκι!
    const interval = setInterval(fetchUnreadData, 10000);
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

  const getActiveStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      ...linkStyle,
      color: isActive ? COLORS.darkbrown : COLORS.dark,
      borderBottom: isActive ? `3px solid ${COLORS.darkbrown}` : '3px solid transparent',
      paddingBottom: '5px', 
    };
  };

  const profileDropdownItems = [
    { title: "ΤΟ ΠΡΟΦΙΛ ΜΟΥ", path: "/profile", desc: "Δείτε και επεξεργαστείτε τα στοιχεία σας", icon: "/user.png" },
    { title: "ΡΥΘΜΙΣΕΙΣ", path: "/settings", desc: "Διαχειριστείτε τον λογαριασμό σας", icon: "/settings.png" },
  ];

  return (
    <nav style={navStyle}>

      {/* ─── LOGO ─── */}
      <Link to="/" style={{ marginRight: '0px', display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <img 
          src="/logo.png" 
          alt="EventQ Logo" 
          style={{ 
            width: '160px',       
            height: '160px',      
            objectFit: 'contain' 
          }} 
        />
      </Link>

      {/* ─── ΔΥΝΑΜΙΚΟ LINKS AREA ─── */} 
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        
        {role !== 'ADMIN' && (
          <>
            <Link to="/" style={getActiveStyle('/')}>ΑΡΧΙΚΗ</Link>
            <Link to="/events" style={getActiveStyle('/events')}>ΠΕΡΙΗΓΗΣΗ ΣΕ ΕΚΔΗΛΩΣΕΙΣ</Link>
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <Link to="/admin/users" style={getActiveStyle('/admin/users')}>ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ</Link>
            <Link to="/admin/export" style={getActiveStyle('/admin/export')}>ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ</Link>
          </>
        )}

        {role === 'ORGANIZER' && (
          <>
            <Link to="/my-events" style={getActiveStyle('/my-events')}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</Link>
          </>
        )}

        {user && role !== 'ADMIN' && (
          <>
            <Link to="/my-bookings" style={getActiveStyle('/my-bookings')}>ΙΣΤΟΡΙΚΟ</Link>
          </>
        )}

        {user && role !== 'ADMIN' && (
          <>
            {/* Μηνύματα */}
            <Link to="/messages" style={iconLinkStyle} title="Messages">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src="/email.png" alt="" style={{ width: '23px', height: '21px' }} />
                {unreadCount > 0 && (
                  <span style={badgeStyle}>{unreadCount}</span>
                )}
              </div>
            </Link>
            
            {/* Ειδοποιήσεις με Δυναμικό Κόκκινο Κυκλάκι */}
            <Link 
              to="/notifications" 
              style={{ ...iconLinkStyle, color: location.pathname === '/notifications' ? COLORS.primary : COLORS.dark }} 
              title="Notifications"
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src="/notification.png" alt="" style={{ width: '22px', height: '22px' }} />
                {unreadNotificationsCount > 0 && (
                  <span style={badgeStyle}>{unreadNotificationsCount}</span>
                )}
              </div>
            </Link>
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
                      {/* ─── ΜΟΝΟ ΤΟ ICON ΧΩΡΙΣ ΤΟ ICONBOX ─── */}
                      {typeof item.icon === 'string' && item.icon.startsWith('/') ? (
                        <img 
                          src={item.icon} 
                          alt="" 
                          style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} 
                        />
                      ) : (
                        <span style={{ fontSize: '1.4rem', width: '24px', textAlign: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                      )}
                      
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
                    <div>
                      <img src="/power.png" alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0  }} />
                    </div>
                    <div>
                      <div style={{ ...itemTitle, color: '#da5e5e' }}>ΑΠΟΣΥΝΔΕΣΗ</div>
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
  fontFamily: 'Poppins, sans-serif'
};

const linkStyle = {
  textDecoration: 'none',
  fontSize: '1.04rem',
  fontWeight: '600',
  transition: 'color 0.2s, border-color 0.2s',
  cursor: 'pointer'
};

const badgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  backgroundColor: '#ff4d4f', 
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
  marginLeft: '0px',
  marginRight: '0px',
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
  padding: '9px 20px',
  borderRadius: '50px',
  border: 'none',
  background: COLORS.primary,
  color: COLORS.dark,
  fontSize: '0.9rem',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: `0 4px 15px rgba(210, 184, 147, 0.25)`,
  transition: '0.3s',
  fontFamily: 'Poppins, sans-serif',
};

export default Navbar;