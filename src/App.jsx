import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Search from './pages/Search'
import WatchRoom from "./pages/WatchRoom";
import Library from "./pages/Library";
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/history" element={<Library />} />
        <Route path="/favorites" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/watch/:id" element={<WatchRoom />} />
        <Route path="/room/:roomId" element={<WatchRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
