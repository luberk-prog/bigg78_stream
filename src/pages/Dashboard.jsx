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
  const { getRecommendationQuery } = useWatchHistory()
  
  const [trending, setTrending] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  // Fallback mock videos split into categories
  const mockTrending = mockVideos.filter(v => v.category === 'trending')
  const mockRecommended = mockVideos.filter(v => v.category === 'recommended')

  const fetchTrending = useCallback(async () => {
    if (!hasApiKey()) {
      setLoadingTrending(false)
      return
    }
    try {
      const trendReq = getTrending(50)
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
  }, [getRecommendationQuery])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  // Split trending into rows
  const row2 = recommended.length > 0 ? recommended : (trending.length > 0 ? trending.slice(15, 30) : mockRecommended)
  const heroVideos = trending.length > 0 ? trending.slice(0, 10) : [mockVideos[1]]
  const heroVideo = heroVideos[activeHeroIndex] || heroVideos[0]
  const isLoading = loadingTrending

  const heroThumbnail = heroVideo.youtubeId
    ? `https://i.ytimg.com/vi/${heroVideo.youtubeId}/maxresdefault.jpg`
    : heroVideo.thumbnail?.replace('480/270', '1200/675') || ''

  const watchHero = () => {
    const dest = heroVideo.youtubeId || heroVideo.id
    navigate(`/watch/${dest}`)
  }

  return (
    <div className="min-h-screen cinematic-bg text-white selection:bg-white/20 relative overflow-x-hidden">
      {/* Dark Overlay for Cinematic BG */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      
      <Sidebar />
      <TopToolbar />

      <main className="relative z-10 pl-32 pr-12 pt-32 pb-12 transition-all duration-700 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Left Lane: Navigation & Continued */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-10 animate-fade-in-up">
            
            {/* Top 10 Micro-Lane */}
            <section className="glass-card p-6 border border-white/10 shadow-3xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                  Trending Now
                </h3>
                <span className="text-[9px] text-white/30 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Today</span>
              </div>
              <div className="space-y-6">
                {(trending.length > 0 ? trending : mockVideos).slice(0, 5).map((v, i) => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.youtubeId || v.id}`)} className="flex items-center gap-4 cursor-pointer group active:scale-95 transition-all">
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
                {mockVideos.slice(4, 7).map(v => (
                  <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex items-center gap-4 group cursor-pointer active:scale-95 transition-all">
                    <div className="relative w-24 aspect-[16/10] rounded-lg overflow-hidden shrink-0 shadow-lg border border-white/5">
                      <img src={v.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                        <div className="h-full bg-brand w-2/3 shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-bold truncate group-hover:text-brand-light transition-colors">{v.title}</h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">S1 : E5</p>
                    </div>
                    <button className="w-7 h-7 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white/20 group-hover:text-white group-hover:bg-white/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Lane: Hero & Gallery */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
                  {/* Multilayered Gradients for Depth */}
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
                        onClick={watchHero}
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

                  {/* Navigation Bullets inside Banner */}
                  <div className="absolute bottom-12 right-12 flex gap-4">
                     <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                     </button>
                     <button className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white border border-white/10 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                     </button>
                  </div>
                </>
              )}
            </section>

            {/* Portrait Grid: You Might Like */}
            <section className="mt-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <h2 className="text-2xl font-black tracking-tight text-white/90">You might like</h2>
                <button className="bg-white/5 backdrop-blur-md px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-white/10">See all content</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {row2.slice(0, 4).map((v) => (
                  <VideoCard 
                    key={v.id} 
                    video={v} 
                    onClick={(v) => navigate(`/watch/${v.youtubeId || v.id}`)} 
                  />
                ))}
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  )
}
