import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import VideoCard from '../components/VideoCard'
import { mockVideos } from '../data/mockVideos'
import { mockRooms } from '../data/mockMessages'
import { searchYouTube, getTrending, hasApiKey } from '../lib/youtube'
import { useWatchHistory } from '../hooks/useWatchHistory'

// Loading skeleton card
function SkeletonCard({ wide }) {
  return (
    <div className={`${wide ? 'w-80' : 'w-64'} shrink-0`}>
      <div className="rounded-xl aspect-video skeleton" />
      <div className="mt-2.5 space-y-2">
        <div className="h-3 skeleton rounded w-5/6" />
        <div className="h-3 skeleton rounded w-3/6" />
      </div>
    </div>
  )
}

function VideoRow({ title, videos, loading, size }) {
  return (
    <section className="py-2">
      <h2 className="text-xl font-black text-white/90 mb-4 px-1 uppercase tracking-wider">
        {title}
      </h2>
      <div className="scroll-row">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} wide={size === 'lg'} />)
          : videos.map(v => <VideoCard key={v.youtubeId || v.id} video={v} size={size || 'md'} />)
        }
      </div>
    </section>
  )
}

// Error / no-key alert banner
function ApiBanner({ message }) {
  return (
    <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm px-4 py-3 rounded-xl mb-6">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getRecommendationQuery } = useWatchHistory()
  
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')

  const [trending, setTrending] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loadingTrending, setLoadingTrending] = useState(true)
  const [apiError, setApiError] = useState('')
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  const fetchTrending = useCallback(async () => {
    if (!hasApiKey()) {
      setApiError('Add your YouTube API key to load real content.')
      setLoadingTrending(false)
      return
    }
    try {
      // Fetch more for the carousel and rows
      const trendReq = getTrending(50)
      
      const recQuery = getRecommendationQuery()
      let recReq = recQuery ? searchYouTube(recQuery, 10) : null;
      
      const [trendRes, recRes] = await Promise.all([trendReq, recReq || trendReq])
      setTrending(trendRes.items || [])
      setRecommended(recReq ? (recRes.items || []) : [])
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        setApiError('Add your YouTube API key to .env (VITE_YOUTUBE_API_KEY) to load real content.')
      } else {
        setApiError(`YouTube API error: ${err.message}. Showing mock content.`)
      }
    } finally {
      setLoadingTrending(false)
    }
  }, [getRecommendationQuery])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  // Hero carousel timer
  useEffect(() => {
    if (trending.length > 0) {
      const interval = setInterval(() => {
        setActiveHeroIndex(prev => (prev + 1) % Math.min(trending.length, 10))
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [trending.length])

  // Split trending into rows
  const row1 = trending.length > 0 ? trending.slice(0, 15) : mockTrending
  const row2 = recommended.length > 0 ? recommended : (trending.length > 0 ? trending.slice(15, 30) : mockRecommended)
  const row3 = trending.length > 0 ? trending.slice(30, 45) : mockWatchAgain
  const heroVideos = trending.length > 0 ? trending.slice(0, 10) : [mockVideos[1]]
  const heroVideo = heroVideos[activeHeroIndex] || heroVideos[0]
  const isLoading = loadingTrending

  const joinRoom = (e) => {
    e.preventDefault()
    if (roomCode.trim()) navigate(`/room/${roomCode.trim()}`)
  }

  const heroThumbnail = heroVideo.youtubeId
    ? `https://i.ytimg.com/vi/${heroVideo.youtubeId}/maxresdefault.jpg`
    : heroVideo.thumbnail?.replace('480/270', '1200/675') || ''

  const watchHero = () => {
    const dest = heroVideo.youtubeId || heroVideo.id
    navigate(`/watch/${dest}`)
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Hero Banner Carousel */}
      <section className="relative h-[85vh] min-h-[600px] flex items-end overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 skeleton" />
        ) : (
          <div className="absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out">
            <img
              key={heroVideo.id}
              src={heroVideo.youtubeId
                ? `https://i.ytimg.com/vi/${heroVideo.youtubeId}/maxresdefault.jpg`
                : heroVideo.thumbnail?.replace('480/270', '1200/675') || ''
              }
              alt={heroVideo.title}
              className="absolute inset-0 w-full h-full object-cover animate-scale-in"
              onError={e => { e.target.src = heroVideo.thumbnail || '' }}
            />
          </div>
        )}
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 pb-24 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4 animate-fade-in-up">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 backdrop-blur-md border border-white/10">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Trending</span>
              </div>
              <span className="text-white/40 text-xs font-medium uppercase tracking-[0.2em]">{heroVideo.channel}</span>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-14 skeleton rounded-lg w-3/4" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-4/5" />
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <h1 className="text-5xl sm:text-7xl font-black text-white mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
                  {heroVideo.title}
                </h1>
                <p className="text-white/70 text-lg mb-8 line-clamp-3 max-w-xl leading-relaxed drop-shadow-lg">
                  {heroVideo.description || 'Experience the next level of collaborative watching. Join thousands already streaming together in high definition.'}
                </p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => navigate(`/watch/${heroVideo.youtubeId || heroVideo.id}`)}
                    className="group bg-white text-black font-bold px-8 py-4 rounded-md hover:bg-white/90 transition-all flex items-center gap-3"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
                    <span>Play Now</span>
                  </button>
                  <button 
                    onClick={() => setShowRoomModal(true)}
                    className="bg-dark-600/40 backdrop-blur-md text-white font-bold px-8 py-4 rounded-md hover:bg-dark-600/60 transition-all border border-white/10 flex items-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Create Room</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carousel dots */}
          <div className="absolute right-6 bottom-24 flex flex-col gap-2">
            {heroVideos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveHeroIndex(i)}
                className={`w-1 h-8 rounded-full transition-all duration-500 ${i === activeHeroIndex ? 'bg-white h-12' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-10 space-y-10">
        {/* API warning banner */}
        {apiError && <ApiBanner message={apiError} />}

        {/* Active Rooms */}
        <section>
          <h2 className="section-title">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Active Watch Rooms
          </h2>
          <div className="scroll-row">
            {mockRooms.map(room => (
              <div
                key={room.id}
                onClick={() => navigate(`/room/${room.id}`)}
                className="shrink-0 w-56 card-glass p-4 cursor-pointer hover:border-brand/30 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono text-white/30">{room.id}</span>
                </div>
                <p className="font-semibold text-white text-sm mb-1 group-hover:text-brand-light transition-colors">{room.name}</p>
                <p className="text-xs text-white/40 mb-3 line-clamp-2">{room.video}</p>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-1">
                    {Array.from({ length: Math.min(room.members, 4) }).map((_, i) => (
                      <img key={i} src={`https://picsum.photos/seed/user${i + 1}/40/40`} alt="" className="w-5 h-5 rounded-full border border-dark-800 object-cover" />
                    ))}
                  </div>
                  <span className="text-xs text-white/40">{room.members} watching</span>
                </div>
              </div>
            ))}
            <div
              onClick={() => setShowRoomModal(true)}
              className="shrink-0 w-56 border-2 border-dashed border-white/10 rounded-xl p-4 cursor-pointer hover:border-brand/30 hover:bg-brand/5 transition-all duration-300 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white/60">Create Room</span>
            </div>
          </div>
        </section>

        <VideoRow
          title={hasApiKey() ? 'Trending on YouTube' : 'Trending Now'}
          videos={row1}
          loading={isLoading}
          icon="🔥"
          size="lg"
        />
        <VideoRow
          title={hasApiKey() ? 'Popular Right Now' : 'Recommended For You'}
          videos={row2}
          loading={isLoading}
          icon="✨"
        />
        <VideoRow
          title={hasApiKey() ? 'More To Watch' : 'Watch Again'}
          videos={row3}
          loading={isLoading}
          icon="🎬"
          size="sm"
        />
      </main>

      {/* Watch Party Modal */}
      {showRoomModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowRoomModal(false)}
        >
          <div className="card-glass w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-1">Join a Watch Party</h3>
            <p className="text-white/50 text-sm mb-6">Enter a room code from your friends</p>
            <form onSubmit={joinRoom} className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                className="input-field text-center font-mono tracking-widest text-lg uppercase"
                placeholder="ROOM-XXXX"
                maxLength={9}
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowRoomModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Join Room</button>
              </div>
            </form>
            <div className="relative flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button
              onClick={() => { setShowRoomModal(false); navigate('/search'); }}
              className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search & Create Room
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
