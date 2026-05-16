import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
      } catch (err) {
        setError('Σφάλμα φόρτωσης εκδηλώσεων');
      }
    };
    fetchEvents();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h2>Εκδηλώσεις</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {events.length === 0 && <p>Δεν υπάρχουν εκδηλώσεις</p>}
      {events.map((event) => (
        <div key={event.id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
          <h3>{event.title}</h3>
          <p>{event.description}</p>
          <p>📍 {event.venue}, {event.city}</p>
          <p>📅 {new Date(event.startDateTime).toLocaleDateString('el-GR')}</p>
          <p>🎫 {event.ticketTypes?.map(t => `${t.name}: ${t.price}€`).join(' | ')}</p>
        </div>
      ))}
    </div>
  );
}