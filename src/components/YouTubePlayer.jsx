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
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
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

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value)
    setVolume(val)
    playerRef.current.setVolume(val)
    if (val > 0 && isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    }
  }

  const handleScrub = (e) => {
    if (!isHost) return
    const time = parseFloat(e.target.value)
    playerRef.current.seekTo(time, true)
    socket?.emit('seek', roomId, time)
  }

  const handleSkip = (seconds) => {
    if (!isHost) return
    const current = playerRef.current?.getCurrentTime() || 0
    const dur = playerRef.current?.getDuration() || 0
    const newTime = Math.max(0, Math.min(dur, current + seconds))
    playerRef.current.seekTo(newTime, true)
    socket?.emit('seek', roomId, newTime)
  }

  const handleFullscreen = () => {
    const el = containerRef.current?.parentElement // The black group div
    if (!el) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen()
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen()
      }
    }
  }

  const videoIdRef = useRef(videoId)
  const isHostRef = useRef(isHost)
  const roomIdRef = useRef(roomId)

  useEffect(() => {
    videoIdRef.current = videoId
    isHostRef.current = isHost
    roomIdRef.current = roomId
  }, [videoId, isHost, roomId])

  // Single Effect for API Loading
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
    }
  }, [])

  // Single Effect for Player Mounting
  useEffect(() => {
    let internalPlayer = null
    
    const initPlayer = () => {
      if (!containerRef.current || internalPlayer) return
      
      internalPlayer = new window.YT.Player(containerRef.current, {
        videoId: videoIdRef.current,
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          fs: 0,
          disablekb: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: (event) => {
            playerRef.current = event.target
            setPlayerReady(true)
            setDuration(event.target.getDuration())
            event.target.setVolume(volume)
          },
          onStateChange: (event) => {
            if (onStateChange) onStateChange(event.data)
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            
            if (isHostRef.current && !isSyncing.current) {
              const time = event.target.getCurrentTime()
              if (event.data === window.YT.PlayerState.PLAYING) {
                socket?.emit('play', roomIdRef.current, time)
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                socket?.emit('pause', roomIdRef.current, time)
              }
            }
          }
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      const prevCbk = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (prevCbk) prevCbk()
        initPlayer()
      }
    }

    return () => {
      if (internalPlayer?.destroy) {
        internalPlayer.destroy()
        playerRef.current = null
        setPlayerReady(false)
      }
    }
  }, []) // Mount ONLY once

  // Handle Video Switching without Unmounting
  useEffect(() => {
    if (playerReady && videoId && playerRef.current?.loadVideoById) {
      const currentId = playerRef.current.getVideoData?.()?.video_id
      if (currentId !== videoId) {
        playerRef.current.loadVideoById(videoId)
      }
    }
  }, [videoId, playerReady])

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
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleSkip(-10)}
                  disabled={!isHost}
                  className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 opacity-60 hover:opacity-100 disabled:opacity-20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM2.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 009 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
                </button>
                
                <button 
                  onClick={togglePlay}
                  disabled={!isHost}
                  className="w-14 h-14 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-2xl"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
                  )}
                </button>

                <button 
                  onClick={() => handleSkip(10)}
                  disabled={!isHost}
                  className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 opacity-60 hover:opacity-100 disabled:opacity-20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM21.933 12.8a1 1 0 000-1.6L16.6 7.2A1 1 0 0015 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
                </button>
              </div>
              
              <div className="flex flex-col">
                 <span className="text-[8px] font-black tracking-widest uppercase opacity-40">Tuning</span>
                 <span className="text-sm font-bold mono tracking-tighter">
                   {formatTime(currentTime)} / {formatTime(duration)}
                 </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 group/volume relative">
                  <button 
                    onClick={toggleMute}
                    className="glass p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                  >
                    {isMuted || volume === 0 ? (
                       <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    ) : (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    )}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-8 h-24 bg-dark-900 shadow-3xl border border-white/10 rounded-xl p-2 opacity-0 group-hover/volume:opacity-100 transition-all pointer-events-none group-hover/volume:pointer-events-auto">
                     <input 
                        type="range"
                        min={0}
                        max={100}
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-white/10 rounded-full appearance-none cursor-pointer outline-none -rotate-90 origin-left translate-x-1.5 translate-y-[64px]"
                     />
                  </div>
               </div>

               <button 
                 onClick={handleFullscreen}
                 className="glass p-3 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
