import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './components/Login'
import Register from './components/Register'
import Events from './pages/Events'
import AdminUsers from './pages/AdminUsers'
import CreateEvent from './pages/CreateEvent'
import MyEvents from './pages/MyEvents'
import Messages from './pages/Messages'
import EventDetail from './pages/EventDetail'
import Navbar from './components/Navbar'
import MyBookings from './pages/MyBookings'
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminExport from './pages/AdminExport'
import Settings from './pages/Settings'; 
import OrganizerBookings from './pages/OrganizerBookings';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/history" element={<MyBookings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/export" element={<AdminExport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/organizer/bookings" element={<OrganizerBookings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)