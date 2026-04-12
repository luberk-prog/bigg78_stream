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
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [isVideoEnded, setIsVideoEnded] = useState(false)

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
        setIsVideoEnded(false) // Reset on new video loading

        // Determine if videoId looks like a YouTube ID
        const isYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(currentVideoId)

        if (isYouTubeId && hasApiKey()) {
          const [detail, searchRes] = await Promise.all([
            getVideoById(currentVideoId),
            searchYouTube(currentVideoId, 12).catch(() => ({ items: [] })),
          ])
          if (cancelled) return
          if (detail) {
            setVideo(detail)
            addToHistory(detail)
            setRelated((searchRes.items || []).filter(v => v.youtubeId !== currentVideoId))
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
    setIsVideoEnded(false);
    if (paramRoomId && hasPlaybackControl && socket) {
      socket.emit('change-video', paramRoomId, targetId);
      setRefreshKey(prev => prev + 1); // Local update
    } else {
      navigate(`/watch/${targetId}`);
    }
  }

  const handlePlayerStateChange = (state) => {
    if (state === 0) { // 0 is window.YT.PlayerState.ENDED
      setIsVideoEnded(true);
    } else if (state === 1) { // 1 is window.YT.PlayerState.PLAYING
      setIsVideoEnded(false);
    }
  }

  const handleHostSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !hasApiKey()) return;
    setLoading(true);
    try {
      const res = await searchYouTube(searchQuery, 20);
      setRelated(res.items.filter(v => v.youtubeId !== playerVideoId));
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

            {/* Chat toggle (Only on desktop/large screens, mobile chat is handled by overlay) */}
            <div className="hidden lg:flex items-center gap-1 bg-dark-700 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setIsTheaterMode(prev => !prev)}
                className={`p-1.5 rounded-md transition-all ${isTheaterMode ? 'bg-brand/20 text-brand' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="Theater Mode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              <button
                onClick={() => setChatOpen(p => !p)}
                className={`p-1.5 rounded-md transition-all ${chatOpen ? 'bg-brand/20 text-brand' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                title="Toggle Sidebar Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row flex-1 pt-14 min-h-0 overflow-hidden">
        {/* Left: video + info + related */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
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
          <div className={`w-full bg-black flex justify-center transition-all duration-500 ${isTheaterMode ? 'px-0 py-0' : 'px-0 lg:px-6'}`}>
            {loading ? (
              <div
                className={`w-full aspect-video skeleton transition-all duration-500 ${isTheaterMode ? '' : 'lg:my-6 lg:rounded-2xl'}`}
                style={{ maxHeight: '90vh', maxWidth: '100%' }}
              />
            ) : (
              <div ref={fullScreenRef} className={`relative w-full flex justify-center group transition-all duration-500 ${isFullscreen ? 'bg-black' : ''}`} style={{ height: isFullscreen ? '100vh' : (isTheaterMode ? '90vh' : '88vh'), maxWidth: '100%' }}>
                <YouTubePlayer
                  videoId={playerVideoId}
                  socket={socket}
                  roomId={paramRoomId}
                  isHost={hasPlaybackControl}
                  onSyncStatusChange={setSyncStatus}
                  onStateChange={handlePlayerStateChange}
                />

                {/* Custom End-Screen Overlay */}
                {isVideoEnded && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col p-4 sm:p-8 animate-fade-in overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-white">Up Next on Bigg78</h2>
                      <button onClick={() => setIsVideoEnded(false)} className="text-white/40 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {related.slice(0, 6).map(v => (
                        <div key={v.id} onClick={() => handleVideoSelect(v)} className="group cursor-pointer">
                          <div className="aspect-video rounded-lg overflow-hidden relative mb-2">
                            <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                              <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1 group-hover:text-brand transition-colors">{v.title}</p>
                          <p className="text-[10px] sm:text-xs text-white/40">{v.channel}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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

          {/* Content Area */}
          <div className="px-4 sm:px-6 py-5 max-w-5xl mx-auto w-full">
            {loading ? (
              <div className="space-y-3">
                <SkeletonText height="h-6" width="w-3/4" />
                <SkeletonText height="h-4" width="w-1/2" />
              </div>
            ) : (
              <>
                <h1 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">{video?.title}</h1>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/50 mb-4 flex-wrap">
                  {video?.channel && <span className="font-medium text-white/70">{video.channel}</span>}
                  {video?.views && <span className="flex items-center gap-2"><span className="opacity-30">·</span>{video.views} views</span>}
                  {video?.duration && <span className="flex items-center gap-2"><span className="opacity-30">·</span>{video.duration}</span>}
                </div>

                {/* Mobile Action Row */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                  <button className="flex-none flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 px-4 py-2 rounded-full text-sm whitespace-nowrap">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4l-1.4 1.866a4 4 0 00-.8 2.4z"/></svg>
                    Like
                  </button>
                  <button
                    onClick={copyRoomCode}
                    className="flex-none flex items-center gap-2 bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand-light px-4 py-2 rounded-full text-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 100-2.684 3 3 0 000 2.684zm0 12.684a3 3 0 100-2.684 3 3 0 000 2.684z"/></svg> 
                    {showCopied ? 'Copied!' : 'Share Room'}
                  </button>
                  <a
                    href={`https://www.youtube.com/watch?v=${playerVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-400 px-4 py-2 rounded-full text-sm whitespace-nowrap"
                  >
                    Open on YT
                  </a>
                </div>

                {/* Mobile Members Section */}
                <div className="lg:hidden block mb-10">
                  <h3 className="text-base font-bold text-white mb-4">Room Management</h3>
                  <div className="bg-white/5 rounded-2xl p-1 border border-white/5">
                    <ChatSidebar
                      roomId={ROOM_ID}
                      socket={socket}
                      user={user}
                      isOriginHost={isHost}
                      participants={participants}
                    />
                  </div>
                </div>

                {/* Related / Up Next */}
                <div className="mt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-bold text-white">Up Next</h2>
                    {hasPlaybackControl && (
                      <form onSubmit={handleHostSearch} className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search videos..."
                          className="bg-dark-700 border border-white/10 text-white text-sm rounded-xl px-4 py-2 flex-1 sm:w-64 focus:outline-none focus:border-brand/40"
                        />
                        <button type="submit" className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
                          Search
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {related.map(v => (
                      <div
                        key={v.youtubeId || v.id}
                        onClick={() => handleVideoSelect(v)}
                        className="flex gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-xl transition-all"
                      >
                        <div className="relative rounded-lg overflow-hidden shrink-0 w-32 sm:w-40 aspect-video bg-dark-600">
                          <img
                            src={v.thumbnail || (v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg` : '')}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-light transition-colors leading-tight">
                            {v.title}
                          </p>
                          <p className="text-[10px] text-white/40 mt-1">{v.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Desktop Sidebar (Toggled) */}
        <div
          className={`shrink-0 bg-dark-900 border-l border-white/5 transition-all duration-300 hidden lg:block overflow-hidden ${chatOpen ? 'w-80' : 'w-0 border-0'}`}
        >
          <div className="w-80 h-full">
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

