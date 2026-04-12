import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import TopToolbar from '../components/TopToolbar'
import VideoCard from '../components/VideoCard'
import { mockVideos } from '../data/mockVideos'
import { searchYouTube, getTrending, hasApiKey } from '../lib/youtube'
import { useWatchHistory } from '../hooks/useWatchHistory'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { history, favorites, toggleFavorite, isFavorite, getRecommendationQuery } = useWatchHistory()
  
  const [activeCat, setActiveCat] = useState('Trending')
  const [trending, setTrending] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [createdRoomId, setCreatedRoomId] = useState(null)

  // Fallback mock videos split into categories
  const mockTrending = mockVideos.filter(v => v.category === 'trending')
  const mockRecommended = mockVideos.filter(v => v.category === 'recommended')

  const fetchTrending = useCallback(async () => {
    setLoadingTrending(true)
    if (!hasApiKey()) {
      setLoadingTrending(false)
      return
    }
    try {
      const isDiscovery = activeCat !== 'Trending'
      const trendReq = isDiscovery ? searchYouTube(activeCat, 50) : getTrending(50)
      const recQuery = getRecommendationQuery()
      let recReq = recQuery ? searchYouTube(recQuery, 10) : null;
      
      const [trendRes, recRes] = await Promise.all([trendReq, recReq || trendReq])
      setTrending(trendRes.items || [])
      setRecommended(recReq ? (recRes.items || []) : [])
    } catch (err) {
      console.error('YouTube API error:', err)
    } finally {
      setLoadingTrending(false)
    }
  }, [getRecommendationQuery, activeCat])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  const handleStartParty = async (video) => {
    setIsCreatingRoom(true)
    const videoId = video.youtubeId || video.id
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoId,
          host: user?.name || user?.email || 'Guest',
          roomName: roomName
        })
      })
      if (res.ok) {
        const room = await res.json()
        setCreatedRoomId(room.roomId)
        // Wait a beat for the user to see the code, then navigate or let them click
        // For now, let's navigate after 2s
        setTimeout(() => navigate(`/room/${room.roomId}`), 1000)
      } else {
        throw new Error('Server error')
      }
    } catch (err) {
      console.error('Failed to create room:', err)
      // Fallback to local watch if server fails
      navigate(`/watch/${videoId}`)
    } finally {
      setIsCreatingRoom(false)
      setSelectedVideo(null)
    }
  }

  // Split trending into rows
  const row2 = recommended.length > 0 ? recommended : (trending.length > 0 ? trending.slice(15, 30) : mockRecommended)
  const heroVideos = trending.length > 0 ? trending.slice(0, 10) : [mockVideos[1]]
  const heroVideo = heroVideos[activeHeroIndex] || heroVideos[0]
  const isLoading = loadingTrending

  const heroThumbnail = heroVideo.youtubeId
    ? `https://i.ytimg.com/vi/${heroVideo.youtubeId}/maxresdefault.jpg`
    : heroVideo.thumbnail?.replace('480/270', '1200/675') || ''

  return (
    <div className="min-h-screen cinematic-bg text-white selection:bg-white/20 relative overflow-x-hidden">
      {/* Dark Overlay for Cinematic BG */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      
      <Sidebar />
      <TopToolbar activeCat={activeCat} setActiveCat={setActiveCat} />

      <main className="relative z-10 pl-32 pr-12 pt-32 pb-12 transition-all duration-700 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Lane: Navigation & Continued */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-10 animate-fade-in-up">
            
            {/* Trending Micro-Lane */}
            <section className="glass-card p-6 border border-white/10 shadow-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                  {activeCat} Now
                </h3>
                <span className="text-[9px] text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Today</span>
              </div>
              <div className="space-y-6">
                {(trending.length > 0 ? trending : mockVideos).slice(0, 5).map((v, i) => (
                  <div key={v.id} onClick={() => setSelectedVideo(v)} className="flex items-center gap-4 cursor-pointer group active:scale-95 transition-all">
                    <div className="relative w-28 aspect-video rounded-xl overflow-hidden shadow-xl shrink-0 group-hover:scale-110 transition-transform duration-500 border border-white/5">
                      <img src={v.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand/40 shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                      <span className="absolute bottom-1 right-2 text-[8px] font-black text-white/40 tracking-tighter italic select-none group-hover:text-brand/60 transition-colors uppercase">{i + 1}</span>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="text-[11px] font-bold leading-tight group-hover:text-brand-light transition-colors line-clamp-2">{v.title}</h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest truncate">{v.channel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Continue Watching Vertical */}
            <section className="glass-card p-6 flex-1 border border-white/10 shadow-3xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6 px-1">
                Continue Watching
              </h3>
              <div className="space-y-6">
                {history.length > 0 ? history.slice(0, 4).map(v => (
                  <div key={v.id || v.youtubeId} onClick={() => setSelectedVideo(v)} className="flex items-center gap-4 group cursor-pointer active:scale-95 transition-all">
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 shadow-lg border border-white/5">
                      <img src={v.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                        <div className="h-full bg-brand shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" style={{ width: `${Math.min(100, (v.lastPosition / (v.durationSec || 600)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold truncate group-hover:text-brand-light transition-colors">{v.title}</h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">{v.channel}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-widest">No history yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Lane: Hero & Gallery */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            
            {/* Onboarding Welcome Banner */}
            <section className="glass-card p-8 border border-white/10 shadow-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-all duration-700" />
               <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-brand/20 flex items-center justify-center text-brand shrink-0 border border-brand/20 shadow-2xl">
                     <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                     <h2 className="text-2xl font-black mb-1 tracking-tight">Stream Anything, <span className="text-brand">Together</span></h2>
                     <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xl">Search for any YouTube video, host a private theater, and chat with friends in perfect sync. Welcome to the future of collaborative entertainment.</p>
                  </div>
                  <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
               </div>
            </section>

            {/* Mega Hero Banner */}
            <section className="relative h-[500px] rounded-[2.5rem] overflow-hidden group shadow-3xl border border-white/10 bg-dark-800">
              {isLoading ? (
                <div className="absolute inset-0 skeleton" />
              ) : (
                <>
                  <img 
                    src={heroThumbnail} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105" 
                    alt="hero" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-10 left-12 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-brand px-3 py-1 rounded-full shadow-2xl shadow-brand/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Trending Now</span>
                    </div>
                  </div>

                  <div className="absolute bottom-12 left-12 max-w-2xl px-2">
                    <h1 className="text-6xl font-black mb-6 tracking-tighter leading-[0.9] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-fade-in-up">
                      {heroVideo.title}
                    </h1>
                    <div className="flex items-center gap-3 mb-8">
                       <span className="bg-brand/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-brand-light border border-brand/20">Featured</span>
                       <span className="text-white/40 text-[11px] ml-1 font-bold tracking-tight">{heroVideo.channel}</span>
                    </div>
                    <p className="text-white/60 text-base mb-10 line-clamp-2 max-w-xl leading-relaxed drop-shadow-md font-medium">
                      {heroVideo.description || 'Step into a world of unparalleled cinematic brilliance where technology meets human destiny in an epic struggle across the stars.'}
                    </p>
                    <div className="flex items-center gap-5">
                      <button 
                        onClick={() => setSelectedVideo(heroVideo)}
                        className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:bg-white/90 active:scale-95 transition-all flex items-center gap-3 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
                        Watch Now
                      </button>
                      <button className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all text-white/50 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Gallery Grid */}
            <section className="mt-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-black tracking-tight text-white/90">Curated for You</h2>
                <button className="bg-white/5 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-white/10">Discover More</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {row2.slice(0, 4).map((v) => (
                  <VideoCard 
                    key={v.id} 
                    video={v} 
                    onClick={(v) => setSelectedVideo(v)} 
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Video Selection Overlay (The "Start Party" Entry Point) */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setSelectedVideo(null)} />
          <div className="relative glass-card max-w-2xl w-full overflow-hidden border border-white/10 shadow-3xl animate-scale-in">
            <div className="relative aspect-video">
              <img src={selectedVideo.thumbnail} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight">{selectedVideo.title}</h2>
              <p className="text-white/40 mb-10 text-sm font-medium leading-relaxed">{selectedVideo.description || 'Join millions of viewers in this cinematic journey. Experience it alone or host a private room for your friends.'}</p>
              
              <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 block italic">Customization</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Cinematic Experience Room"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs font-bold focus:outline-none focus:border-brand/40 transition-all placeholder:text-white/10"
                />
              </div>
              
              <div className="flex gap-6 relative">
                {createdRoomId ? (
                   <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-6 animate-fade-in rounded-2xl border border-brand/20">
                      <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h3 className="text-xl font-black mb-1">Room Created!</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Room Code: <span className="text-brand select-all">{createdRoomId}</span></p>
                      <div className="w-full bg-white/5 p-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest animate-pulse">Entering Theater...</div>
                   </div>
                ) : null}

                <button 
                  className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
                  title="Add to Favorites"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(selectedVideo);
                  }}
                >
                  <svg 
                    className={`w-6 h-6 transition-all ${isFavorite(selectedVideo.youtubeId || selectedVideo.id) ? 'fill-brand text-brand scale-110' : 'text-white/40 group-hover:text-white'}`} 
                    fill={isFavorite(selectedVideo.youtubeId || selectedVideo.id) ? "currentColor" : "none"}
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button 
                  onClick={() => navigate(`/watch/${selectedVideo.youtubeId || selectedVideo.id}`)}
                  className="flex-1 bg-white text-black font-black py-5 rounded-2xl hover:bg-white/90 active:scale-95 transition-all shadow-xl text-sm uppercase tracking-widest"
                >
                  Watch Alone
                </button>
                <button 
                  onClick={() => handleStartParty(selectedVideo)}
                  disabled={isCreatingRoom || createdRoomId}
                  className="flex-[1.5] bg-brand text-white font-black py-5 rounded-2xl hover:bg-brand-light active:scale-95 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isCreatingRoom ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  )}
                  Host Party
                </button>
              </div>
              <p className="text-center mt-6 text-[10px] uppercase font-black tracking-widest text-white/20">Private room link will be generated instantly</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
