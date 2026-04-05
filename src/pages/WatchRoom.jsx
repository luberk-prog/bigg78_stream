import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { useWatchHistory } from '../hooks/useWatchHistory'
import GlassChat from '../components/GlassChat'
import ChatSidebar from '../components/ChatSidebar'
import YouTubePlayer from '../components/YouTubePlayer'
import VideoCard from '../components/VideoCard'
import { getVideoById, searchYouTube, hasApiKey } from '../lib/youtube'
import { mockVideos } from '../data/mockVideos'
import { mockMessages } from '../data/mockMessages'

const ROOM_ID = 'ROOM-XJ8F'

function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return <div className={`${height} ${width} skeleton rounded`} />
}

export default function WatchRoom() {
  const { id: routeVideoId, roomId: paramRoomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToHistory } = useWatchHistory()

  const ROOM_ID = paramRoomId || 'ROOM-XJ8F'

  const [video, setVideo] = useState(null)
  const [related, setRelated] = useState([])
  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [chatOpen, setChatOpen] = useState(true)
  const [showCopied, setShowCopied] = useState(false)
  const [socket, setSocket] = useState(null)
  const [syncStatus, setSyncStatus] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [participants, setParticipants] = useState([])

  const fullScreenRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const isHost = Boolean(user?.email && roomData?.host === user.email)
  const isCoHost = participants.find(p => p.socketId === socket?.id)?.role === 'co-host'
  const hasPlaybackControl = isHost || isCoHost

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      fullScreenRef.current?.requestFullscreen?.().catch(console.error)
    } else {
      document.exitFullscreen?.().catch(console.error)
    }
  }

  // Manage socket connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  // Join server room
  useEffect(() => {
    if (socket && paramRoomId) {
      // Pass the user context up to the socket router
      socket.emit('join-room', paramRoomId, user || {});

      const handleVideoChange = () => setRefreshKey(k => k + 1);
      const handleParticipants = (p) => setParticipants(p);
      const handleKick = () => {
        // Automatically bounce kicked clients directly back into the Dashboard
        navigate('/dashboard', { state: { apiError: 'You have been kicked by the Host.' } });
      };

      socket.on('change-video', handleVideoChange);
      socket.on('participants-updated', handleParticipants);
      socket.on('kicked', handleKick);
      
      return () => {
        socket.off('change-video', handleVideoChange);
        socket.off('participants-updated', handleParticipants);
        socket.off('kicked', handleKick);
      }
    }
  }, [socket, paramRoomId, user, navigate]);

  const copyRoomCode = () => {
    const roomUrl = window.location.href;
    navigator.clipboard.writeText(roomUrl)
      .then(() => alert("Room link copied!"))
      .catch(() => alert("Failed to copy link"));
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setApiError('')

    async function loadVideo() {
      setVideo(null)
      setRoomData(null)
      let currentVideoId = routeVideoId;
      
      try {
        // Always enforce the videoId configured in the backend for this room
        if (paramRoomId) {
          try {
            const roomRes = await fetch(`/api/rooms/${paramRoomId}`);
            if (roomRes.ok) {
              const data = await roomRes.json()
              if (cancelled) return;
              console.log("Fetched room data:", data);
              setRoomData(data)
              currentVideoId = data.videoId
            } else {
              setApiError('Notice: Room link might be invalid or backend is unreachable.')
              if (!cancelled) setLoading(false)
              return
            }
          } catch (err) {
            console.error("Failed to fetch room data:", err)
            setApiError('Notice: Room link might be invalid or backend is unreachable.')
            if (!cancelled) setLoading(false)
            return
          }
        }

        if (!currentVideoId) {
          if (!cancelled) setLoading(false)
          return
        }

        // Determine if videoId looks like a YouTube ID
        const isYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(currentVideoId)

        if (isYouTubeId && hasApiKey()) {
          const [detail, searchResults] = await Promise.all([
            getVideoById(currentVideoId),
            searchYouTube(currentVideoId, 8).catch(() => []),
          ])
          if (cancelled) return
          if (detail) {
            setVideo(detail)
            addToHistory(detail)
            setRelated(searchResults.filter(v => v.youtubeId !== currentVideoId).slice(0, 6))
          } else {
            throw new Error('Video not found')
          }
        } else if (isYouTubeId && !hasApiKey()) {
          if (!cancelled) {
            setVideo({
              id: currentVideoId,
              youtubeId: currentVideoId,
              title: 'YouTube Video',
              channel: '',
              thumbnail: `https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`,
              views: '',
              duration: '',
              description: '',
            })
            setApiError('Add VITE_YOUTUBE_API_KEY to .env to load video details and related videos.')
            setRelated(mockVideos.slice(0, 6))
          }
        } else {
          // Legacy mock ID
          const mock = mockVideos.find(v => v.id === currentVideoId) || mockVideos[0]
          if (!cancelled) {
            setVideo({ ...mock, youtubeId: null })
            addToHistory(mock)
            setRelated(mockVideos.filter(v => v.id !== currentVideoId).slice(0, 6))
          }
        }
      } catch (err) {
        if (cancelled) return
        console.error("Failed to load video details:", err)
        setApiError(`Couldn't load video details: ${err.message}`)
        const mock = mockVideos[0]
        setVideo({ ...mock, youtubeId: currentVideoId })
        setRelated(mockVideos.slice(1, 7))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadVideo()
    return () => { cancelled = true }
  }, [routeVideoId, paramRoomId, refreshKey])

  // Set explicitly the known video payload
  const playerVideoId = video?.youtubeId || video?.id || null

  const handleVideoSelect = (v) => {
    const targetId = v.youtubeId || v.id;
    if (paramRoomId && hasPlaybackControl && socket) {
      socket.emit('change-video', paramRoomId, targetId);
      setRefreshKey(prev => prev + 1); // Local update
    } else {
      navigate(`/watch/${targetId}`);
    }
  }

  const handleHostSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !hasApiKey()) return;
    setLoading(true);
    try {
      const results = await searchYouTube(searchQuery, 12);
      setRelated(results.filter(v => v.youtubeId !== playerVideoId));
    } catch (err) {
      setApiError('Search failed. Using mock content.');
    } finally {
      setLoading(false);
    }
  }

  // Ensure safe rendering to prevent blank screen crashes before data arrives
  if (paramRoomId && (!roomData || !playerVideoId)) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-4">
        {apiError ? (
          <div className="text-red-400 text-center max-w-md bg-red-400/10 p-4 rounded-xl border border-red-400/20">{apiError}</div>
        ) : (
          <div className="text-white text-lg font-semibold animate-pulse">Loading room...</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center gap-2 ml-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-sm font-semibold text-white truncate">
              {loading ? 'Loading…' : (video?.title || 'Watch Room')}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {syncStatus && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                <span className="text-xs text-yellow-300 font-medium">{syncStatus}</span>
              </div>
            )}
            
            {roomData?.host && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg">
                <span className="text-xs text-brand/70 font-semibold uppercase tracking-wider">Host</span>
                <span className="text-sm text-brand-light font-medium">{roomData.host}</span>
              </div>
            )}
            
            {/* Room code */}
            <div className="hidden sm:flex items-center gap-2 bg-dark-700 border border-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xs text-white/40">Room:</span>
              <span className="text-xs font-mono text-white font-semibold">{ROOM_ID}</span>
              <button onClick={copyRoomCode} className="text-brand hover:text-brand-light transition-colors">
                {showCopied ? (
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Chat toggle */}
            <button
              onClick={() => setChatOpen(p => !p)}
              className={`p-2 rounded-lg transition-all ${chatOpen ? 'bg-brand/20 text-brand' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="flex flex-1 pt-14">
        {/* Left: video + info + related */}
        <div className="flex-1 min-w-0 flex flex-col overflow-auto">
          {/* API error banner */}
          {apiError && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs px-3 py-2.5 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {apiError}
            </div>
          )}

          {/* YouTube Player */}
          <div className="w-full bg-dark-900 border-b border-white/5 flex justify-center px-0 sm:px-6">
            {loading ? (
              <div 
                className="w-full aspect-video skeleton sm:my-4 sm:rounded-xl" 
                style={{ maxHeight: '75vh', maxWidth: 'calc(75vh * 16 / 9)' }}
              />
            ) : (
              <div ref={fullScreenRef} className={`relative w-full flex justify-center group ${isFullscreen ? 'bg-black' : ''}`} style={{ maxHeight: isFullscreen ? '100vh' : '75vh', maxWidth: isFullscreen ? '100vw' : 'calc(75vh * 16 / 9)' }}>
                 <YouTubePlayer 
                   videoId={playerVideoId} 
                   socket={socket} 
                   roomId={paramRoomId}
                   isHost={hasPlaybackControl} 
                   onSyncStatusChange={setSyncStatus} 
                 />

                 <GlassChat 
                    roomId={paramRoomId} 
                    socket={socket} 
                    user={user} 
                    participants={participants} 
                 />

                 <button 
                   onClick={toggleFullscreen}
                   className={`absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2 rounded-lg text-white transition-opacity duration-300 ${isFullscreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                   title="Toggle Fullscreen"
                 >
                   {isFullscreen ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                     </svg>
                   )}
                 </button>
              </div>
            )}
          </div>

          {/* Video info */}
          <div className="px-6 py-5 max-w-4xl">
            {loading ? (
              <div className="space-y-3">
                <SkeletonText height="h-6" width="w-3/4" />
                <SkeletonText height="h-4" width="w-1/2" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-white mb-2">{video?.title}</h1>
                <div className="flex items-center gap-4 text-sm text-white/50 mb-4 flex-wrap">
                  {video?.channel && <span className="font-medium text-white/70">{video.channel}</span>}
                  {video?.views && <><span>·</span><span>{video.views} views</span></>}
                  {video?.duration && <><span>·</span><span>{video.duration}</span></>}
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {[
                    { icon: '👍', label: 'Like' },
                    { icon: '💾', label: 'Save' },
                    { icon: '🔗', label: 'Share Room' },
                  ].map(btn => (
                    <button key={btn.label} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full text-sm transition-all">
                      <span>{btn.icon}</span>
                      {btn.label}
                    </button>
                  ))}
                  {playerVideoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${playerVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-full text-sm transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 90 20" fill="none">
                        <path d="M27.97 3.77A3.58 3.58 0 0 0 25.48 1.2C23.25.6 14.5.6 14.5.6s-8.75 0-10.98.6A3.58 3.58 0 0 0 1.03 3.77C.45 6.04.45 10.7.45 10.7s0 4.67.58 6.93a3.58 3.58 0 0 0 2.49 2.57c2.23.6 10.98.6 10.98.6s8.75 0 10.98-.6a3.58 3.58 0 0 0 2.49-2.57c.58-2.26.58-6.93.58-6.93s0-4.66-.58-6.93z" fill="#FF0000"/>
                        <path d="M11.73 14.36l7.27-3.66-7.27-3.66v7.32z" fill="#fff"/>
                      </svg>
                      Open on YouTube
                    </a>
                  )}
                </div>

                {/* Description */}
                {video?.description && (
                  <details className="group">
                    <summary className="text-sm text-white/50 cursor-pointer hover:text-white/70 transition-colors list-none flex items-center gap-2">
                      <span>Description</span>
                      <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <p className="mt-2 text-sm text-white/40 leading-relaxed whitespace-pre-line line-clamp-6">
                      {video.description}
                    </p>
                  </details>
                )}
              </>
            )}

            {/* Related / Up Next / Search Results */}
            <div className="mt-8">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                <h3 className="text-base font-bold text-white">Up Next</h3>
                {hasPlaybackControl && (
                  <form onSubmit={handleHostSearch} className="flex gap-2 min-w-[200px] flex-1 sm:flex-none">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search to switch video..." 
                      className="bg-dark-700 border border-white/10 text-white text-sm rounded-full px-4 py-2 w-full focus:outline-none focus:border-brand/40"
                    />
                    <button type="submit" className="bg-brand/20 hover:bg-brand/40 text-brand-light px-4 rounded-full text-sm font-semibold transition-colors">
                      Search
                    </button>
                  </form>
                )}
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="shrink-0 w-40 aspect-video skeleton rounded-lg" />
                      <div className="flex-1 space-y-2 pt-1">
                        <SkeletonText width="w-full" />
                        <SkeletonText width="w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {related.map(v => (
                    <div
                      key={v.youtubeId || v.id}
                      onClick={() => handleVideoSelect(v)}
                      className="flex gap-3 cursor-pointer group"
                    >
                      <div className="relative rounded-lg overflow-hidden shrink-0 w-40 aspect-video bg-dark-600">
                        <img
                          src={v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg` : v.thumbnail)}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => {
                            const defaultUrl = `https://i.ytimg.com/vi/${v.youtubeId}/default.jpg`;
                            if (v.youtubeId && e.target.src !== defaultUrl) {
                              e.target.src = defaultUrl;
                            } else {
                              e.target.src = `https://picsum.photos/seed/${v.id}/320/180`;
                            }
                          }}
                        />
                        {v.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                            {v.duration}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-light transition-colors">
                          {v.title}
                        </p>
                        <p className="text-xs text-white/40 mt-1">{v.channel}</p>
                        {v.views && <p className="text-xs text-white/30 mt-0.5">{v.views} views</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 bg-dark-900 border-l border-white/5 order-3 xl:block hidden">
          <div className="h-[calc(100vh-64px)] sticky top-16">
            <ChatSidebar 
              roomId={ROOM_ID} 
              socket={socket} 
              user={user} 
              isOriginHost={isHost} 
              participants={participants} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
