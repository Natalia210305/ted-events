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
<<<<<<< HEAD
import Messages from './pages/Messages'
=======
import EventDetail from './pages/EventDetail'
import Navbar from './components/Navbar'
>>>>>>> 3183b68517f153da4b7a3ca536061e36e61123d3

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
      </Routes>
    </BrowserRouter>
  </StrictMode>
)