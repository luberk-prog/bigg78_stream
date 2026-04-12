import { useEffect, useRef, useState } from 'react'
import { useWatchHistory } from '../hooks/useWatchHistory'

export default function YouTubePlayer({ 
  videoId, 
  socket, 
  roomId, 
  isHost, 
  onSyncStatusChange,
  onStateChange 
}) {
  const { updateProgress } = useWatchHistory()
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const isSyncing = useRef(false)
  const [playerReady, setPlayerReady] = useState(false)

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const controlsTimeout = useRef(null)

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
  }

  const togglePlay = () => {
    if (!isHost) return
    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      playerRef.current.playVideo()
    }
  }

  const handleScrub = (e) => {
    if (!isHost) return
    const time = parseFloat(e.target.value)
    playerRef.current.seekTo(time, true)
    socket?.emit('seek', roomId, time)
  }

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0, // Disable native
          rel: 0,
          modestbranding: 1,
          fs: 0,
          disablekb: isHost ? 0 : 1,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true)
            setDuration(event.target.getDuration())
          },
          onStateChange: (event) => {
            if (onStateChange) onStateChange(event.data)
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            
            if (isHost && !isSyncing.current) {
              const time = event.target.getCurrentTime()
              if (event.data === window.YT.PlayerState.PLAYING) {
                socket?.emit('play', roomId, time)
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                socket?.emit('pause', roomId, time)
              }
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current) playerRef.current.destroy()
    }
  }, [videoId, isHost, roomId, socket])

  // Sync state
  useEffect(() => {
    if (socket && playerReady) {
      const handlePlay = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.seekTo(time, true)
        playerRef.current.playVideo()
        setTimeout(() => { isSyncing.current = false }, 500)
      }
      const handlePause = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.pauseVideo()
        playerRef.current.seekTo(time, true)
        setTimeout(() => { isSyncing.current = false }, 500)
      }
      const handleSeek = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.seekTo(time, true)
        setTimeout(() => { isSyncing.current = false }, 500)
      }
      socket.on('play', handlePlay)
      socket.on('pause', handlePause)
      socket.on('seek', handleSeek)
      return () => {
        socket.off('play', handlePlay)
        socket.off('pause', handlePause)
        socket.off('seek', handleSeek)
      }
    }
  }, [socket, playerReady, isHost])

  // Track Time & Save Progress
  useEffect(() => {
    if (playerReady) {
      const interval = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          const time = playerRef.current.getCurrentTime()
          setCurrentTime(time)
          // Only auto-save if playing and it's a valid ID
          if (isPlaying && videoId) {
            updateProgress(videoId, time)
          }
        }
      }, 5000) // Save every 5 seconds
      return () => clearInterval(interval)
    }
  }, [playerReady, isPlaying, videoId, updateProgress])

  return (
    <div 
      className="relative w-full h-full bg-black group overflow-hidden" 
      onMouseMove={handleMouseMove}
    >
      <div ref={containerRef} className="w-full h-full pointer-events-none" />
      
      {/* Apple TV Style Glass Controls */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 flex flex-col gap-6">
          {/* Mini Scrubber */}
          <div className="relative group/scrub">
             <input 
               type="range"
               min={0}
               max={duration}
               value={currentTime}
               onChange={handleScrub}
               disabled={!isHost}
               className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all group-hover/scrub:h-2"
               style={{
                 background: `linear-gradient(to right, white ${(currentTime/duration)*100}%, rgba(255,255,255,0.1) ${(currentTime/duration)*100}%)`
               }}
             />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={togglePlay}
                disabled={!isHost}
                className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              >
                {isPlaying ? (
                   <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                   <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
                )}
              </button>
              
              <div className="flex flex-col">
                 <span className="text-xs font-black tracking-widest uppercase opacity-40">Tuning</span>
                 <span className="text-sm font-bold mono tracking-tighter">
                   {formatTime(currentTime)} / {formatTime(duration)}
                 </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button className="glass p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all opacity-40 hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
               </button>
               <button className="glass p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
