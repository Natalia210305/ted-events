import { useNavigate } from 'react-router-dom';

export default function AdminExport() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f0eb', fontFamily: 'Montserrat, sans-serif', padding: '60px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '2px', marginBottom: '40px' }}>
          ΕΞΑΓΩΓΗ ΕΚΔΗΛΩΣΕΩΝ
        </h1>

        <div style={{ display: 'flex', gap: '20px' }}>
          <button onClick={() => handleExport('xml')} style={{ padding: '20px 40px', backgroundColor: '#d2b893', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>
            📄 EXPORT XML
          </button>
          <button onClick={() => handleExport('json')} style={{ padding: '20px 40px', backgroundColor: '#2c2c2c', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '700', fontSize: '14px', letterSpacing: '1px' }}>
            📋 EXPORT JSON
          </button>
        </div>

        <p style={{ marginTop: '20px', color: '#888', fontSize: '13px' }}>
          Τα αρχεία περιέχουν όλες τις εκδηλώσεις.
        </p>
      </div>
    </div>
  );
}