import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { useWatchHistory } from '../hooks/useWatchHistory'
import GlassChat from '../components/GlassChat'
import ChatSidebar from '../components/ChatSidebar'
import YouTubePlayer from '../components/YouTubePlayer'
import VideoCard from '../components/VideoCard'
import VoiceChat from '../components/VoiceChat'
import { getVideoById, searchYouTube, hasApiKey } from '../lib/youtube'
import { mockVideos } from '../data/mockVideos'

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
  const [autoNext, setAutoNext] = useState(true)
  const [isUpNextVisible, setIsUpNextVisible] = useState(false)

  const isHost = Boolean(user?.email && roomData?.host === user.email)
  const isCoHost = participants.find(p => p.socketId === socket?.id)?.role === 'co-host'
  const hasPlaybackControl = !paramRoomId || isHost || isCoHost

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && paramRoomId) {
      socket.emit('join-room', paramRoomId, user || {});
      const handleVideoChange = () => setRefreshKey(k => k + 1);
      const handleParticipants = (p) => setParticipants(p);
      const handleKick = () => navigate('/dashboard', { state: { apiError: 'Kicked by host' } });

      socket.on('change-video', handleVideoChange);
      socket.on('participants-updated', handleParticipants);
      socket.on('kicked', handleKick);
      socket.on('sync-video', ({ videoId, time }) => {
        if (videoId) {
          setRefreshKey(prev => prev + 1);
          setTimeout(() => {
            if (window.player) {
              window.player.seekTo(time, true);
            }
          }, 1000);
        }
      });
      return () => {
        socket.off('change-video', handleVideoChange);
        socket.off('participants-updated', handleParticipants);
        socket.off('kicked', handleKick);
        socket.off('sync-video');
      }
    }
  }, [socket, paramRoomId, user, navigate]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => setShowCopied(true))
    setTimeout(() => setShowCopied(false), 2000);
  };

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    async function loadVideo() {
      let currentVideoId = routeVideoId;
      try {
        if (paramRoomId) {
          const roomRes = await fetch(`/api/rooms/${paramRoomId}`);
          if (roomRes.ok) {
            const data = await roomRes.json()
            if (cancelled) return;
            setRoomData(data)
            currentVideoId = data.videoId
          }
        }
        if (!currentVideoId) { setLoading(false); return; }
        
        const isYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(currentVideoId)
        if (isYouTubeId && hasApiKey()) {
          const [detail, searchRes] = await Promise.all([
            getVideoById(currentVideoId),
            searchYouTube(currentVideoId, 12).catch(() => ({ items: [] })),
          ])
          if (cancelled) return
          setVideo(detail); addToHistory(detail);
          setRelated((searchRes.items || []).filter(v => (v.youtubeId || v.id) !== currentVideoId))
        } else {
          const mock = mockVideos.find(v => v.id === currentVideoId) || mockVideos[0]
          setVideo({ ...mock, youtubeId: isYouTubeId ? currentVideoId : null })
          setRelated(mockVideos.slice(0, 8))
        }
      } catch (err) {
        setApiError('Notice: Playing with restricted data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadVideo()
    return () => { cancelled = true }
  }, [routeVideoId, paramRoomId, refreshKey])

  // Auto-Next Logic
  useEffect(() => {
    if (isVideoEnded && autoNext && related.length > 0 && hasPlaybackControl) {
      const nextVid = related[0];
      const targetId = nextVid.youtubeId || nextVid.id;
      if (paramRoomId && socket) {
        socket.emit('change-video', paramRoomId, targetId);
      } else {
        navigate(`/watch/${targetId}`);
      }
      setIsVideoEnded(false);
    }
  }, [isVideoEnded, autoNext, related, hasPlaybackControl, paramRoomId, socket, navigate])

  // Periodic Sync from Host
  useEffect(() => {
    if (!socket || !hasPlaybackControl) return;

    const interval = setInterval(() => {
      if (window.player && paramRoomId) {
        const time = window.player.getCurrentTime();
        socket.emit("sync-time", {
            roomId: paramRoomId,
            time
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, hasPlaybackControl, paramRoomId]);

  const playerVideoId = video?.youtubeId || video?.id || null

  const handleVideoSelect = (v) => {
    const targetId = v.youtubeId || v.id;
    if (paramRoomId && hasPlaybackControl && socket) {
      socket.emit('change-video', paramRoomId, targetId);
    } else {
      navigate(`/watch/${targetId}`);
    }
  }

  return (
    <div className="min-h-screen cinematic-bg text-white relative flex flex-col">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-none" />
      
      {/* Top Navigation Bar */}
      <nav className="relative z-50 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Watching Now</h2>
            <p className="text-sm font-bold truncate max-w-[300px] leading-tight">{video?.title || 'Loading content...'}</p>
          </div>
        </div>

        <div className="glass p-1 rounded-2xl flex items-center gap-2 border border-white/10">
          <div className="px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mr-2">Room:</span>
            <span className="text-xs font-mono font-bold text-brand-light">{ROOM_ID}</span>
          </div>
          <button 
            onClick={copyRoomCode}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showCopied ? 'bg-green-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {showCopied ? 'Copied' : 'Invite'}
          </button>
        </div>

        <div className="flex items-center gap-4">
           {syncStatus && <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500/80 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">{syncStatus}</span>}
           <div className="flex -space-x-2">
             {participants.slice(0, 3).map((p, i) => (
               <img key={i} src={`https://i.pravatar.cc/100?u=${p.socketId}`} className="w-9 h-9 rounded-full border-2 border-dark-900 shadow-xl" alt="" />
             ))}
             {participants.length > 3 && (
               <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold border-2 border-dark-900 backdrop-blur-md">+{participants.length - 3}</div>
             )}
           </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex gap-8 px-8 pb-8 min-h-0 overflow-hidden">
        {/* Left Aspect-Locked Video Column */}
        <div className="flex-[3] flex flex-col min-w-0">
          <div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-3xl border border-white/10 bg-black animate-fade-in group">
            {playerVideoId ? (
              <YouTubePlayer
                videoId={playerVideoId}
                socket={socket}
                roomId={paramRoomId}
                isHost={hasPlaybackControl}
                onSyncStatusChange={setSyncStatus}
                onStateChange={(s) => setIsVideoEnded(s === 0)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-dark-900">
                <div className="w-10 h-10 border-2 border-brand/50 border-t-brand rounded-full animate-spin" />
              </div>
            )}
            {/* Global Chat Overlay Inside Player for Immersive Feel */}
            <GlassChat
              roomId={paramRoomId}
              socket={socket}
              user={user}
              participants={participants}
            />
          </div>

          <div className="mt-8 px-4 flex flex-col gap-6">
             {/* Voice Chat Component */}
             <VoiceChat socket={socket} roomId={paramRoomId} />

             <div className="flex justify-between items-start gap-10">
               <div className="flex-1">
                  <h1 className="text-3xl font-black mb-4 tracking-tighter leading-tight">{video?.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-white/40 font-bold uppercase tracking-widest">
                    <span>{video?.channel}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{video?.views} views</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{video?.duration}</span>
                </div>
                <p className="mt-6 text-white/50 text-base leading-relaxed line-clamp-2 max-w-2xl">{video?.description}</p>
             </div>
             
             <div className="flex items-center gap-4 shrink-0 mt-2">
                <button className="glass w-14 h-14 rounded-2xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all border border-white/10 shadow-2xl">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4l-1.4 1.866a4 4 0 00-.8 2.4z"/></svg>
                </button>
                <button 
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`glass w-14 h-14 rounded-2xl flex items-center justify-center transition-all border border-white/10 shadow-2xl ${isTheaterMode ? 'bg-brand text-white border-brand shadow-brand/40' : 'text-white/40 hover:text-white'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
             </div>
           </div>
          </div>
        </div>
        {/* Right Pane: Members & Up Next */}
        {/* Right Pane: Members & Immersive Content Toggle */}
        <div className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <section className="glass-card flex-none border border-white/10 shadow-3xl">
             <ChatSidebar
                roomId={paramRoomId}
                socket={socket}
                user={user}
                isOriginHost={isHost}
                participants={participants}
              />
          </section>

          {/* Collapsible Up Next / Queue */}
          <section className="relative flex-1 flex flex-col min-h-0">
             <button 
                onClick={() => setIsUpNextVisible(!isUpNextVisible)}
                className="w-full glass-card p-6 border border-white/10 flex items-center justify-between group hover:bg-white/5 transition-all"
             >
                <div className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">Up Next Dropdown</h3>
                </div>
                <svg className={`w-5 h-5 text-white/20 transition-transform duration-500 ${isUpNextVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </button>

             {isUpNextVisible && (
                <div className="absolute top-full left-0 w-full mt-4 glass-card p-6 border border-white/10 shadow-3xl z-40 animate-fade-in-up max-h-[400px] overflow-hidden flex flex-col">
                   <div className="flex items-center justify-between mb-6 shrink-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Queueing {related.length} items</span>
                      <div className="flex items-center gap-3">
                         <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Auto Next</span>
                         <button 
                            onClick={(e) => { e.stopPropagation(); setAutoNext(!autoNext); }}
                            className={`w-10 h-5 rounded-full transition-all relative ${autoNext ? 'bg-brand' : 'bg-white/10'}`}
                         >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autoNext ? 'left-6' : 'left-1'}`} />
                         </button>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                      {related.map(v => (
                         <div key={v.id} onClick={() => handleVideoSelect(v)} className="flex gap-4 group cursor-pointer active:scale-95 transition-all">
                            <div className="relative w-28 aspect-video rounded-xl overflow-hidden shrink-0 shadow-lg border border-white/5">
                               <img src={v.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" alt="" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z" /></svg>
                               </div>
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                               <h4 className="text-xs font-bold leading-tight group-hover:text-brand-light transition-colors line-clamp-1">{v.title}</h4>
                               <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-black truncate">{v.channel}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </section>
        </div>
      </main>
    </div>
  )
}
