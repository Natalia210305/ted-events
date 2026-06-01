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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchUnreadData = async () => {
      const storedUser = localStorage.getItem('user');
      const userObj = storedUser ? JSON.parse(storedUser) : null;
      
      if (!userObj) return;

      try {
        const msgResponse = await api.get('/messages/unread-count');
        setUnreadCount(msgResponse.data.count);

        const notifResponse = await api.get('/notifications');
        const unreadNotifs = notifResponse.data.filter(n => n.isRead === false || !n.isRead).length;
        setUnreadNotificationsCount(unreadNotifs);

      } catch (error) {
        console.error("Error fetching unread counts", error);
      }
    };

    fetchUnreadData();

    const handleMessagesRead = () => {
      fetchUnreadData();
    };
    window.addEventListener('messagesRead', handleMessagesRead);

    const interval = setInterval(fetchUnreadData, 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('messagesRead', handleMessagesRead);
    };
  }, []);
  
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

      {/* ─── ΑΡΙΣΤΕΡΑ: LOGO ─── */}
      <div style={logoWrapperStyle}>
        <Link to="/events" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
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
      </div>

      {/* ─── ΚΕΝΤΡΟ: ΑΝΕΤΟ, ΚΕΝΤΡΑΡΙΣΜΕΝΟ ΜΕΝΟΥ LINKS ─── */} 
      <div style={menuLinksStyle}>
        
        {/* 🎯 ΔΙΟΡΘΩΘΗΚΕ: Προστέθηκε η καρτέλα ΑΡΧΙΚΗ για Attendee και Organizer */}
        {role !== 'ADMIN' && (
          <>
            <Link to="/" style={getActiveStyle('/')}>ΑΡΧΙΚΗ</Link>
            <Link to="/events" style={getActiveStyle('/events')}>ΠΕΡΙΗΓΗΣΗ ΣΕ ΕΚΔΗΛΩΣΕΙΣ</Link>
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <Link to="/admin/users" style={getActiveStyle('/admin/users')}>ΔΙΑΧΕΙΡΙΣΗ ΧΡΗΣΤΩΝ</Link>
            <Link to="/events" style={getActiveStyle('/events')}>ΕΚΔΗΛΩΣΕΙΣ</Link>
            <Link to="/admin/export" style={getActiveStyle('/admin/export')}>ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ</Link>
          </>
        )}

        {role === 'ORGANIZER' && (
          <>
            <Link to="/my-events" style={getActiveStyle('/my-events')}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</Link>
            <Link to="/organizer/bookings" style={getActiveStyle('/organizer/bookings')}>ΙΣΤΟΡΙΚΟ ΠΩΛΗΣΕΩΝ</Link>
          </>
        )}

        {user && role === 'ATTENDEE' && (
          <>
            <Link to="/my-bookings" style={getActiveStyle('/my-bookings')}>ΙΣΤΟΡΙΚΟ</Link>
          </>
        )}
      </div>

      {/* ─── ΔΕΞΙΑ: UTILITIES ΜΕ ΑΝΕΣΗ ΧΩΡΟΥ ─── */}
      <div style={rightActionsStyle}>
        {user && (
          <>
            {/* Μηνύματα */}
            <Link to="/messages" style={iconLinkStyle} title="Messages">
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '6px' }}>
                <img src="/email.png" alt="Messages" style={{ width: '23px', height: '21px' }} />
                {unreadCount > 0 && (
                  <span style={badgeStyle}>{unreadCount}</span>
                )}
              </div>
            </Link>
            
            {/* Ειδοποιήσεις */}
            <Link 
              to="/notifications" 
              style={{ ...iconLinkStyle, color: location.pathname === '/notifications' ? COLORS.primary : COLORS.dark }} 
              title="Notifications"
            >
              <div style={{ position: 'relative', display: 'inline-block', marginTop: '4px' }}>
                <img src="/notification.png" alt="Notifications" style={{ width: '22px', height: '22px' }} />
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
              paddingBottom: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/profile.png" 
                alt="Profile" 
                style={{ width: '22px', height: '22px', objectFit: 'contain' }} 
              />
              ΠΡΟΦΙΛ
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
                      <img 
                        src={item.icon} 
                        alt="" 
                        style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} 
                      />
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
                      <img src="/power.png" alt="" style={{ width: '24px', height: '24px', objectFit: 'contain', flexShrink: 0 }} />
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
      </div>
    </nav>
  );
}

// ─── STYLES ───
const navStyle = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between',
  paddingLeft: '24px',
  paddingRight: '40px',
  height: '90px', 
  background: COLORS.white, 
  boxShadow: '0 2px 15px rgba(0,0,0,0.05)',
  position: 'sticky',
  top: 0,
  zIndex: 2000,
  fontFamily: 'Poppins, sans-serif'
};

const logoWrapperStyle = {
  flex: '1',
  display: 'flex',
  justifyContent: 'flex-start'
};

const menuLinksStyle = {
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  gap: '40px',
  flex: '2' 
};

const rightActionsStyle = {
  flex: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '35px'
};

const linkStyle = {
  textDecoration: 'none',
  fontSize: '1.04rem',
  fontWeight: '600',
  transition: 'color 0.2s, border-color 0.2s',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
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

export default Navbar;