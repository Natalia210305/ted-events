import { useNavigate } from 'react-router-dom';

const COLORS = {
  primary: '#d2b893',
  dark: '#2c2c2c',
  textMuted: '#555555',
  bgLight: '#f9f7f5',
  border: '#e4dfda',
  white: '#ffffff',
};

export default function AdminExport() {
  const navigate = useNavigate();

  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/events/export/${type}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events.${type}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Σφάλμα export');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.bgLight, fontFamily: 'Poppins, sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Κεντρικός Τίτλος */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontWeight: '800', fontSize: '1.9rem', letterSpacing: '1px', color: COLORS.dark, margin: 0 }}>
            ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ
          </h1>
          <div style={{ width: '150px', height: '4px', backgroundColor: COLORS.primary, marginTop: '10px', marginRight: 'auto', marginLeft: 'auto' }} />
        </div>

        {/* Κάρτα Επιλογών Export */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '8px',
          padding: '30px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: `5px solid ${COLORS.primary}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => handleExport('xml')} 
              style={{ 
                flex: 1,
                padding: '12px 24px', 
                backgroundColor: 'transparent', 
                color: COLORS.dark, 
                border: `1px solid ${COLORS.primary}`, 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📄 EXPORT XML
            </button>
            
            <button 
              onClick={() => handleExport('json')} 
              style={{ 
                flex: 1,
                padding: '12px 24px', 
                backgroundColor: COLORS.dark, 
                color: COLORS.white, 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              📋 EXPORT JSON
            </button>
          </div>

          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0, textAlign: 'center', fontWeight: '500' }}>
            Τα αρχεία περιέχουν όλες τις εγγεγραμμένες εκδηλώσεις του συστήματος.
          </p>
        </div>

      </div>
    </div>
  );
}