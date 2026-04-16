import { useState, useEffect, useRef } from 'react';
import Peer from 'simple-peer';

export default function VoiceChat({ socket, roomId }) {
  const [peers, setPeers] = useState([]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);
  const [audioError, setAudioError] = useState('');
  
  const userStream = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    if (!socket || !roomId) return;

    // 1. Get user media
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        userStream.current = stream;
        // Start muted by default to not blast audio immediately
        stream.getAudioTracks()[0].enabled = isMicOn; 
        setVoiceConnected(true);
        setAudioError('');
        
        socket.emit("voice-join", roomId);

        // 2. Handle receiving existing users in room
        socket.on("all-users", users => {
          const peersArray = [];
          users.forEach(userId => {
            const peer = createPeer(userId, socket.id, stream);
            peersRef.current.push({
              peerId: userId,
              peer,
            });
            peersArray.push({
              peerId: userId,
              peer,
            });
          });
          setPeers(peersArray);
        });

        // 3. Handle a new user joining the voice chat
        socket.on("user-joined-voice", payload => {
          const peer = addPeer(payload.signal, payload.callerId, stream);
          peersRef.current.push({
            peerId: payload.callerId,
            peer,
          });
          setPeers(prev => [...prev, { peerId: payload.callerId, peer }]);
        });

        // 4. Handle receiving the returned signal
        socket.on("receiving-returned-signal", payload => {
          const item = peersRef.current.find(p => p.peerId === payload.id);
          if (item) {
            item.peer.signal(payload.signal);
          }
        });

      })
      .catch((err) => {
        console.error("Microphone access denied or error:", err);
        setAudioError('Microphone access denied.');
      });

    return () => {
      // Cleanup: stop local tracks
      if (userStream.current) {
        userStream.current.getTracks().forEach(track => track.stop());
      }
      // Cleanup events
      socket.off("all-users");
      socket.off("user-joined-voice");
      socket.off("receiving-returned-signal");
      // Destroy peers
      peersRef.current.forEach(p => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);
      setVoiceConnected(false);
    };
    // Note: We're purposely treating isMicOn carefully below instead of putting it in the dependency array
  }, [socket, roomId]);

  // Handle toggling mic without reloading the whole WebRTC stack
  useEffect(() => {
    if (userStream.current && userStream.current.getAudioTracks().length > 0) {
      userStream.current.getAudioTracks()[0].enabled = isMicOn;
    }
  }, [isMicOn]);

  function createPeer(userToSignal, callerId, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("sending-signal", {
        userToSignal,
        callerId,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, callerId });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  // Audio component to handle autoplay policy elegantly
  const AudioElement = ({ peer }) => {
    const ref = useRef();
    useEffect(() => {
      peer.on("stream", stream => {
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      });
    }, [peer]);
    return <audio playsInline autoPlay ref={ref} />;
  };

  return (
    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 mt-4 animate-fade-in">
      <div className="flex items-center gap-3">
        {voiceConnected ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-[10px] uppercase font-black tracking-widest text-green-400">Voice Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white/20"></span>
            <span className="text-[10px] uppercase font-black tracking-widest text-white/40">
               {audioError ? audioError : 'Connecting Voice...'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {voiceConnected && (
        <button
          onClick={() => setIsMicOn(!isMicOn)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isMicOn 
              ? 'bg-brand text-white shadow-lg shadow-brand/20 hover:bg-brand-light' 
              : 'bg-white/10 text-white/50 hover:bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {isMicOn ? (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
            )}
            {isMicOn ? 'Mic ON' : 'Mic OFF'}
          </div>
        </button>
      )}

      {/* Render invisible audio elements for all peers */}
      <div className="hidden">
        {peers.map((p, index) => (
          <AudioElement key={index} peer={p.peer} />
        ))}
      </div>
    </div>
  );
}
