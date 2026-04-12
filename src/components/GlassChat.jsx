import { useState, useRef, useEffect } from 'react';

export default function GlassChat({ roomId, socket, user, participants }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isIdle, setIsIdle] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const bottomRef = useRef(null);
  const idleTimeout = useRef(null);

  // Manage logic to dynamically fade the chatbox so it doesn't obstruct the video natively
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
       if (!isActive) setIsIdle(true);
    }, 5000);
  };

  useEffect(() => {
    resetIdleTimer();
    return () => clearTimeout(idleTimeout.current);
  }, [isActive, input]);

  useEffect(() => {
    if (socket) {
       const handleReceive = (msg) => {
          const isOwn = msg.email === user?.email;
          setMessages(prev => [...prev, { ...msg, isOwn }]);
          resetIdleTimer();
       };
       socket.on('receive-message', handleReceive);
       return () => socket.off('receive-message', handleReceive);
    }
  }, [socket, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isIdle]);

  const mutedMe = participants?.find(p => p.socketId === socket?.id)?.muted;

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || mutedMe) return;
    
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const msgObj = {
      id: `m${Date.now()}-${Math.random()}`,
      email: user?.email || '',
      user: user?.name || 'Guest',
      text: input.trim(),
      time: timeStr
    };
    
    if (socket) {
       socket.emit('send-message', roomId, msgObj);
    }
    setInput('');
  };

  return (
    <div 
      className={`absolute bottom-6 left-6 z-[100] w-72 sm:w-80 transition-all duration-700 ease-in-out pointer-events-auto ${isIdle && !isActive && input.length === 0 ? 'opacity-20 translate-y-2' : 'opacity-100 translate-y-0'}`}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      <div className="flex flex-col bg-dark-900/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        
        {/* Messages Layout */}
        <div className="max-h-60 overflow-y-auto px-4 py-4 space-y-3 flex flex-col pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
          {messages.map((msg, i) => (
            <div key={msg.id} className="animate-fade-in-up">
               <div className={`p-3 rounded-2xl backdrop-blur-md ${msg.isOwn ? 'bg-brand/30 ml-8 rounded-tr-sm border border-white/10' : 'bg-white/10 mr-8 rounded-tl-sm border border-white/5'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                     <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.isOwn ? 'text-brand-light' : 'text-white/80'}`}>{msg.isOwn ? 'You' : msg.user}</span>
                     <span className="text-[9px] text-white/40">{msg.time}</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed break-words">{msg.text}</p>
               </div>
            </div>
          ))}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Messaging Logic */}
        <form onSubmit={sendMessage} className="px-3 py-3 border-t border-white/10 bg-black/50 relative pointer-events-auto">
          {mutedMe && (
              <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-sm z-10 flex items-center justify-center gap-2">
                 <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                 </svg>
                 <span className="text-red-400 text-[11px] font-bold uppercase tracking-widest">Muted Globally</span>
              </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={mutedMe}
              placeholder="Chat in room..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:bg-white/10 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || mutedMe}
              className="px-3 rounded-xl bg-brand/80 hover:bg-brand disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
