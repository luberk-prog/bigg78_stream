import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VideoCard({ video, size = 'md', layout = 'landscape' }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const sizeClasses = {
    sm: 'w-52',
    md: 'w-64',
    lg: 'w-80',
  }

  const thumbnail = video.youtubeId
    ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
    : video.thumbnail

  const destination = video.youtubeId || video.id

  const handleWatchTogether = async (e) => {
    e.stopPropagation()
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: destination, host: user?.email || 'Guest' })
      })
      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json()
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      console.error('Watch Together error:', err)
    }
  }

  if (layout === 'portrait') {
    return (
      <div 
        onClick={() => navigate(`/watch/${destination}`)}
        className="flex flex-col gap-4 group cursor-pointer animate-fade-in-up"
      >
        <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group-hover:scale-105 transition-all duration-500">
          <img src={video.thumbnail?.replace('hqdefault', 'maxresdefault') || thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-2xl">
              <svg className="w-6 h-6 text-black translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
            </div>
          </div>
        </div>
        <div className="px-2">
          <h4 className="text-sm font-black text-white group-hover:text-brand-light transition-colors line-clamp-1">{video.title}</h4>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">{video.channel}</p>
            <button 
              onClick={handleWatchTogether}
              className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-brand hover:text-white transition-all shadow-lg"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate(`/watch/${destination}`)}
      className={`${sizeClasses[size] || 'w-64'} shrink-0 cursor-pointer group relative transition-all duration-500 hover:z-20`}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-dark-600 border border-white/10 group-hover:rounded-[1.5rem] group-hover:scale-110 shadow-xl group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = 'https://i.ytimg.com/vi/placeholder/hqdefault.jpg' }}
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-2xl">
              <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z"/></svg>
           </div>
        </div>
      </div>
      <div className="mt-4 px-1 group-hover:translate-y-2 transition-transform duration-500">
        <h3 className="text-xs font-black text-white line-clamp-1 group-hover:text-brand-light transition-colors tracking-tight">
          {video.title}
        </h3>
        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-bold">{video.channel}</p>
      </div>
    </div>
  )
}
