import { useEffect, useRef, useState } from 'react';

export default function YouTubePlayer({ videoId, socket, roomId, isHost, onSyncStatusChange, autoplay = true }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isSyncing = useRef(false);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame API programmatically
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => setApiReady(true);
    } else {
      setApiReady(true);
    }
  }, []);

  // Initialize player once API is ready
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    // Create wrapper div to prevent YT from deleting the outer div ref
    const tempEl = document.createElement('div');
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(tempEl);

    playerRef.current = new window.YT.Player(tempEl, {
      videoId,
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        fs: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3
      },
      events: {
        onStateChange: handlePlayerStateChange,
      },
    });

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [apiReady, videoId]);

  const handlePlayerStateChange = (event) => {
    // Block emits if this client is not the official Host
    if (!isHost) return;
    
    // Block emits if we are merely adjusting state due to incoming socket commands
    if (!socket || !roomId || isSyncing.current || !playerRef.current) return;

    const currentTime = playerRef.current.getCurrentTime();

    if (event.data === window.YT.PlayerState.PLAYING) {
      socket.emit('play', roomId, currentTime);
      onSyncStatusChange?.('');
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      socket.emit('pause', roomId, currentTime);
    }
  };

  // Setup receiving socket events
  useEffect(() => {
    if (!socket) return;

    const handleRemotePlay = (time) => {
      isSyncing.current = true;
      if (!isHost) onSyncStatusChange?.('Host is playing...');
      try {
        if (playerRef.current?.seekTo && playerRef.current?.playVideo) {
          playerRef.current.seekTo(time, true);
          playerRef.current.playVideo();
        }
      } catch(e) {}
      
      // Release sync lock
      setTimeout(() => { isSyncing.current = false; if(!isHost) onSyncStatusChange?.(''); }, 500);
    };

    const handleRemotePause = (time) => {
      isSyncing.current = true;
      if (!isHost) onSyncStatusChange?.('Paused by host');
      try {
        if (playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        if (time !== undefined && playerRef.current?.seekTo) {
          playerRef.current.seekTo(time, true);
        }
      } catch(e) {}
      
      // Release sync lock
      setTimeout(() => { isSyncing.current = false; if(!isHost) onSyncStatusChange?.(''); }, 500);
    };

    const handleRemoteSeek = (time) => {
      isSyncing.current = true;
      try {
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(time, true);
        }
      } catch(e) {}
      setTimeout(() => { isSyncing.current = false; }, 500);
    };

    const handleUserJoined = () => {
      if (isHost && playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          const state = playerRef.current.getPlayerState();
          socket.emit('seek', roomId, time);
          if (state === window.YT.PlayerState.PLAYING) {
            socket.emit('play', roomId, time);
          } else if (state === window.YT.PlayerState.PAUSED) {
            socket.emit('pause', roomId, time);
          }
        } catch (e) {}
      }
    };

    socket.on('play', handleRemotePlay);
    socket.on('pause', handleRemotePause);
    socket.on('seek', handleRemoteSeek);
    socket.on('user-joined', handleUserJoined);

    return () => {
      socket.off('play', handleRemotePlay);
      socket.off('pause', handleRemotePause);
      socket.off('seek', handleRemoteSeek);
      socket.off('user-joined', handleUserJoined);
    };
  }, [socket, onSyncStatusChange, isHost, roomId]);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-dark-800 flex items-center justify-center rounded-xl border border-white/10">
        <p className="text-white/40 text-sm">No video selected</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-video mx-auto bg-black flex items-center justify-center sm:rounded-xl overflow-hidden border-0 sm:border border-white/10 sm:my-4 shadow-2xl"
      style={{ maxHeight: '75vh', maxWidth: 'calc(75vh * 16 / 9)' }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
