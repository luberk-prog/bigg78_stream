import { useEffect, useRef, useState } from 'react'

export default function YouTubePlayer({ 
  videoId, 
  socket, 
  roomId, 
  isHost, 
  onSyncStatusChange,
  onStateChange 
}) {
  const playerRef = useRef(null)
  const containerRef = useRef(null)
  const isSyncing = useRef(false)
  const [playerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    // Load YouTube IFrame API
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
          controls: isHost ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          fs: 0, // Disable native FS to allow custom UI overlays
          disablekb: isHost ? 0 : 1
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true)
            console.log('Player ready')
          },
          onStateChange: (event) => {
            if (onStateChange) onStateChange(event.data)
            
            if (isHost && !isSyncing.current) {
              const currentTime = event.target.getCurrentTime()
              if (event.data === window.YT.PlayerState.PLAYING) {
                socket?.emit('play', roomId, currentTime)
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                socket?.emit('pause', roomId, currentTime)
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
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [videoId, isHost, roomId, socket])

  // Socket listeners for sync
  useEffect(() => {
    if (socket && playerReady) {
      const handlePlay = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.seekTo(time, true)
        playerRef.current.playVideo()
        onSyncStatusChange('Synced with host (Play)')
        setTimeout(() => { isSyncing.current = false }, 1000)
      }

      const handlePause = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.pauseVideo()
        playerRef.current.seekTo(time, true)
        onSyncStatusChange('Synced with host (Pause)')
        setTimeout(() => { isSyncing.current = false }, 1000)
      }

      const handleSeek = (time) => {
        if (isHost) return
        isSyncing.current = true
        playerRef.current.seekTo(time, true)
        onSyncStatusChange('Synced with host (Seek)')
        setTimeout(() => { isSyncing.current = false }, 1000)
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
  }, [socket, playerReady, isHost, onSyncStatusChange])

  // Periodically emit seek if host moves time without clicking play/pause (e.g. scrubbing)
  useEffect(() => {
    if (isHost && playerReady) {
      const interval = setInterval(() => {
        if (playerRef.current?.getPlayerState() === window.YT.PlayerState.PLAYING) {
          // Subtle heart-beat or scrub detection could go here
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isHost, playerReady])

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
