import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent-pink flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">
            <span className="text-gradient">Bigg78</span>
            <span className="text-white"> Stream</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos, channels..."
              className="w-full bg-dark-700 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand/50 transition-colors"
            />
          </div>
        </form>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/dashboard" className="nav-link text-sm px-3 py-2 rounded-lg hover:bg-white/5">Home</Link>
          <Link to="/search" className="nav-link text-sm px-3 py-2 rounded-lg hover:bg-white/5">Browse</Link>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 ml-auto shrink-0 relative">
          <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-pink rounded-full"></span>
          </button>
          
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-9 h-9 rounded-full border-2 border-brand/40 object-cover"
                />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-white/10 rounded-xl shadow-xl overflow-hidden py-1 z-50">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/50 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                      navigate('/');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="w-9 h-9 rounded-full bg-gradient-to-br from-brand to-accent-pink flex items-center justify-center text-sm font-bold border-2 border-brand/40 hover:scale-105 transition-transform">
              B
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
