import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Στοιχεία για το Dropdown του Profile
  const profileDropdownItems = [
    { title: "ΤΟ ΠΡΟΦΙΛ ΜΟΥ", path: "/profile", desc: "Δείτε και επεξεργαστείτε τα στοιχεία σας", icon: "👤" },
    { title: "ΡΥΘΜΙΣΕΙΣ", path: "/settings", desc: "Διαχειριστείτε τον λογαριασμό σας", icon: "⚙️" },
    { title: "ΑΠΟΣΥΝΔΕΣΗ", path: "/logout", desc: "Έξοδος από την εφαρμογή", icon: "🚪", isLogout: true },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchVal)}`);
    }
  };

  return (
    <nav style={navStyle}>

      {/* ─── LOGO ─── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '1.7rem', fontWeight: '800', color: COLORS.dark, lineHeight: '1', fontFamily: 'Montserrat, sans-serif' }}>
            EVENT<span style={{ color: COLORS.primary }}>Q</span>
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
            Management
          </span>
        </div>
      </Link>

      {/* ─── DESKTOP LINKS AREA ─── */} 
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <Link to="/" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.color = COLORS.primary}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}>ΑΡΧΙΚΗ</Link>
        
        <Link to="/events" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.color = COLORS.primary}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}>ΠΕΡΙΗΓΗΣΗ ΣΕ ΕΚΔΗΛΩΣΕΙΣ</Link>


        <div style={dividerStyle} />

        {/* ORGANIZER LINKS */}
        <Link to="/my-events" style={linkStyle} onMouseOver={(e) => e.currentTarget.style.color = COLORS.primary}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.dark}>ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΟΥ</Link>

        {/* ICONS AREA */}
        <Link to="/messages" style={iconLinkStyle} title="Messages">💬</Link>
        <Link to="/notifications" style={iconLinkStyle} title="Notifications">🔔</Link>

        {/* PREMIUM PROFILE DROPDOWN */}
        <div 
          style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center' }}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <span style={{ ...linkStyle, color: isDropdownOpen ? COLORS.primary : COLORS.dark, cursor: 'pointer' }}>
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
                    <div style={{ ...iconBox, color: item.isLogout ? '#791F1F' : COLORS.dark }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ ...itemTitle, color: item.isLogout ? '#791F1F' : COLORS.dark }}>{item.title}</div>
                      <div style={itemDesc}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CREATE EVENT BUTTON */}
        <button 
          onClick={() => navigate('/create-event')} 
          style={createButtonStyle}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          + ΔΗΜΙΟΥΡΓΙΑ ΕΚΔΗΛΩΣΗΣ
        </button>
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
  color: COLORS.dark,
  fontSize: '1.05rem',
  fontWeight: '600',
  transition: '0.3s',
  cursor: 'pointer'
};

const iconLinkStyle = {
  textDecoration: 'none',
  fontSize: '1.3rem',
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const searchFormStyle = {
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.bgLight,
  padding: '6px 12px',
  borderRadius: '50px', 
  width: '180px',
};

const searchInputStyle = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: '12px',
  fontFamily: 'Montserrat, sans-serif',
  width: '100%',
  color: COLORS.dark,
};

const searchBtnStyle = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '12px',
};

const dividerStyle = {
  width: '1px',
  height: '25px',
  backgroundColor: COLORS.border,
};

const dropdownWrapper = {
  position: 'absolute',
  top: '80px',
  left: '50%',
  transform: 'translateX(-50%)',
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