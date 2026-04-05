import { useState, useRef, useEffect } from 'react'
import MessageBubble from './MessageBubble'
import { mockMessages } from '../data/mockMessages'

export default function ChatSidebar({ roomId, socket, user, isOriginHost, participants }) {
  // Host Management Functions
  const kickUser = (id) => { if(isOriginHost) socket?.emit('kick-user', roomId, id); }
  const muteUser = (id) => { if(isOriginHost) socket?.emit('mute-user', roomId, id); }
  const promoteUser = (id) => { if(isOriginHost) socket?.emit('promote-user', roomId, id); }

  return (
    <div className="flex flex-col h-full bg-dark-800 border-l border-white/5">
      {/* Header Tabs */}
      <div className="flex border-b border-white/5 shrink-0 bg-dark-900 px-6 py-4 items-center justify-between">
         <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            Active Members
         </h3>
         <span className="text-xs text-white/40">{participants?.length || 1} online</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0 bg-dark-800/50">
        {participants?.map(p => (
           <div key={p.socketId} className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-white/5 hover:border-white/10 transition-colors">
              <img src={p.picture} className="w-10 h-10 rounded-full border border-dark-600 bg-dark-800 shrink-0" alt="avatar" />
              <div className="flex-1 min-w-0">
                 <p className="text-sm text-white font-semibold truncate flex items-center gap-1.5">
                    {p.name} 
                    {p.socketId === socket?.id && <span className="text-[10px] bg-brand/80 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider">You</span>}
                 </p>
                 <p className={`text-[11px] uppercase tracking-wider font-bold mt-0.5 truncate ${p.role === 'host' ? 'text-green-400' : p.role === 'co-host' ? 'text-brand-light' : 'text-white/40'}`}>
                    {p.role} {p.muted && <span className="text-red-400 font-bold tracking-normal lowercase ml-1">· muted</span>}
                 </p>
              </div>
              {isOriginHost && p.socketId !== socket?.id && (
                 <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => promoteUser(p.socketId)} className={`p-2 rounded-lg transition-colors ${p.role === 'co-host' ? 'bg-brand/20 text-brand' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-brand'}`} title={p.role === 'co-host' ? 'Remove Co-Host' : 'Make Co-Host'}>
                       ⭐
                    </button>
                    <button onClick={() => muteUser(p.socketId)} className={`p-2 rounded-lg transition-colors ${p.muted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-yellow-400'}`} title={p.muted ? 'Unmute' : 'Mute User'}>
                       🔇
                    </button>
                    <button onClick={() => kickUser(p.socketId)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/80 hover:text-white text-white/50 transition-colors" title="Kick User from Room">
                       ❌
                    </button>
                 </div>
              )}
           </div>
        ))}
      </div>
    </div>
  )
}
