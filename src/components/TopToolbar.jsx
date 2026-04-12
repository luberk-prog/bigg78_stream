import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const CategoryTab = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
      active 
        ? 'bg-white/20 text-white backdrop-blur-md shadow-lg border border-white/20' 
        : 'text-white/50 hover:text-white hover:bg-white/5'
    }`}
  >
    {label}
  </button>
)

export default function TopToolbar() {
  const [activeCat, setActiveCat] = useState('Movie')
  const { user } = useAuth()
  
  const categories = ['Movie', 'TV Series', 'Animation', 'Mystery', 'More']

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-6 flex items-center justify-between pointer-events-none">
      <div className="flex-1 flex items-center gap-4 pointer-events-auto">
        <div className="glass px-4 py-2.5 rounded-full flex items-center gap-3 border border-white/10 group">
          <svg className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search Movie" 
            className="bg-transparent border-none focus:outline-none text-sm text-white placeholder-white/40 w-48"
          />
        </div>
      </div>

      <div className="glass p-1.5 rounded-full flex items-center gap-1 pointer-events-auto">
        {categories.map(cat => (
          <CategoryTab 
            key={cat} 
            label={cat} 
            active={activeCat === cat} 
            onClick={() => setActiveCat(cat)} 
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-end gap-4 pointer-events-auto">
        <button className="glass p-3 rounded-full hover:bg-white/20 transition-all text-white/70 hover:text-white border border-white/10 relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-dark-900" />
        </button>

        <div className="glass pl-1.5 pr-4 py-1.5 rounded-full flex items-center gap-3 border border-white/10 hover:bg-white/5 transition-all cursor-pointer">
          <img 
            src={user?.picture || 'https://i.pravatar.cc/150?u=apple'} 
            className="w-10 h-10 rounded-full border border-white/20 shadow-lg object-cover" 
            alt="profile" 
          />
          <div className="hidden sm:block">
            <p className="text-xs font-black text-white leading-none">{user?.name || 'Sushmita Arora'}</p>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">@{user?.name?.toLowerCase().replace(' ', '') || 'arora_shush'}</p>
          </div>
          <svg className="w-4 h-4 text-white/30 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
