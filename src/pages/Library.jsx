import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import TopToolbar from '../components/TopToolbar'
import VideoCard from '../components/VideoCard'
import { useWatchHistory } from '../hooks/useWatchHistory'

export default function Library() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { history, favorites } = useWatchHistory()
  const isHistory = pathname === '/history'
  
  const [activeCat, setActiveCat] = useState(isHistory ? 'History' : 'Favorites')
  const displayItems = isHistory ? history : favorites

  return (
    <div className="min-h-screen cinematic-bg text-white selection:bg-white/20 relative overflow-x-hidden">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      
      <Sidebar />
      <TopToolbar activeCat={activeCat} setActiveCat={setActiveCat} />

      <main className="relative z-10 pl-32 pr-12 pt-32 pb-12 max-w-[1920px] mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-4 animate-fade-in-up">
            {isHistory ? 'Watch History' : 'Your Favorites'}
          </h1>
          <p className="text-white/40 text-lg font-medium max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {isHistory 
              ? 'Pick up where you left off or relive your favorite moments.' 
              : 'The content you love, all in one premium space.'}
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {displayItems.length > 0 ? (
            displayItems.map((v) => (
              <VideoCard 
                key={v.id || v.youtubeId} 
                video={v} 
                onClick={(v) => navigate(`/watch/${v.youtubeId || v.id}`)} 
              />
            ))
          ) : (
            <div className="col-span-full py-32 flex flex-col items-center justify-center glass-card border border-white/5">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white/40">No entries in your {isHistory ? 'history' : 'favorites'} yet</h3>
              <button 
                onClick={() => navigate('/dashboard')}
                className="mt-8 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-black uppercase tracking-widest"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
