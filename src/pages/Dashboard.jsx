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

function VideoRow({ title, videos, loading, size, icon }) {
  return (
    <section>
      <h2 className="section-title">
        {icon && <span className="text-lg">{icon}</span>}
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

  // Fallback mock videos split into rows
  const mockTrending = mockVideos.filter(v => v.category === 'trending')
  const mockRecommended = mockVideos.filter(v => v.category === 'recommended')
  const mockWatchAgain = mockVideos.filter(v => v.category === 'watch_again')

  const heroVideo = trending[0] || mockVideos[1]

  const fetchTrending = useCallback(async () => {
    if (!hasApiKey()) {
      setApiError('Add your YouTube API key to .env (VITE_YOUTUBE_API_KEY) to load real content.')
      setLoadingTrending(false)
      return
    }
    try {
      const trendReq = getTrending(24)
      
      const recQuery = getRecommendationQuery()
      let recReq = recQuery ? searchYouTube(recQuery, 8) : null;
      
      const [trendRes, recRes] = await Promise.all([trendReq, recReq || trendReq])
      setTrending(trendRes)
      setRecommended(recReq ? recRes : [])
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        setApiError('Add your YouTube API key to .env (VITE_YOUTUBE_API_KEY) to load real content.')
      } else {
        setApiError(`YouTube API error: ${err.message}. Showing mock content.`)
      }
    } finally {
      setLoadingTrending(false)
    }
  }, [])

  useEffect(() => { fetchTrending() }, [fetchTrending])

  // Split trending into rows
  const row1 = trending.length > 0 ? trending.slice(0, 8) : mockTrending
  const row2 = recommended.length > 0 ? recommended : (trending.length > 0 ? trending.slice(8, 16) : mockRecommended)
  const row3 = trending.length > 0 ? trending.slice(16, 24) : mockWatchAgain
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

      {/* Hero Banner */}
      <section className="relative pt-16 h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 skeleton" />
        ) : (
          <img
            src={heroThumbnail}
            alt={heroVideo.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-900/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-dark-900/30" />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-6 pb-12 w-full">
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                {hasApiKey() ? 'TRENDING' : 'FEATURED'}
              </span>
              <span className="text-white/50 text-sm">{heroVideo.channel}</span>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-10 skeleton rounded w-3/4" />
                <div className="h-4 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-4/5" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight line-clamp-2">
                  {heroVideo.title}
                </h1>
                <p className="text-white/60 text-sm mb-6">
                  {heroVideo.description
                    ? heroVideo.description.slice(0, 140) + '…'
                    : 'The acclaimed title beloved worldwide.'}
                  {heroVideo.duration && (
                    <span className="ml-2 text-white/40">{heroVideo.duration}</span>
                  )}
                  {heroVideo.views && (
                    <span className="ml-1 text-white/40">· {heroVideo.views} views</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={watchHero} className="btn-primary flex items-center gap-2 px-7 py-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Watch Now
                  </button>
                  <button onClick={() => setShowRoomModal(true)} className="btn-secondary flex items-center gap-2 px-6 py-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Watch Party
                  </button>
                </div>
              </>
            )}
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
          <div className="flex gap-4 overflow-x-auto pb-3">
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
