import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VideoCard({ video, size = 'md' }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const sizeClasses = {
    sm: 'w-52',
    md: 'w-64',
    lg: 'w-80',
  }

  // Use YouTube CDN thumbnail if youtubeId is available, else fallback
  const thumbnail = video.youtubeId
    ? `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`
    : video.thumbnail

  const destination = video.youtubeId || video.id

  const handleWatchTogether = async (e) => {
    e.stopPropagation()
    console.log("Selected video:", destination);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: destination,
          host: user?.email || 'Guest'
        })
      })
      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json()
      navigate(`/room/${data.roomId}`)
    } catch (err) {
      console.error('Watch Together error:', err)
      alert("Error creating room. Please ensure the backend is running.")
    }
  }

  return (
    <div
      onClick={() => navigate(`/watch/${destination}`)}
      className={`${sizeClasses[size]} shrink-0 cursor-pointer group hover-card relative transition-transform duration-300 hover:scale-105`}
    >
      {/* Thumbnail Container */}
      <div className="relative rounded-lg overflow-hidden aspect-video bg-dark-600 border border-white/5 group-hover:border-white/20 transition-all duration-300">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.target.src = 'https://i.ytimg.com/vi/placeholder/hqdefault.jpg' }}
        />
        
        {/* Play Icon (Shows on hover) */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-white/10 backdrop-blur-md">
            <svg className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 6v12l10-6z" />
            </svg>
          </div>
          <button 
            onClick={handleWatchTogether}
            className="absolute bottom-4 flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white px-3 py-1 rounded-full text-[10px] font-bold transition-transform shadow-lg"
          >
            Watch Together
          </button>
        </div>

        {/* Netflix-style Metadata Overlay (Bottom up) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-sm font-bold text-white line-clamp-1 mb-0.5 group-hover:text-brand-light transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/60 font-medium truncate max-w-[120px]">{video.channel}</span>
            <span className="text-[9px] text-white/40">{video.views || '50K'} views</span>
          </div>
        </div>

        {/* Duration badge (Always visible) */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-black text-white group-hover:opacity-0 transition-opacity">
            {video.duration}
          </span>
        )}

        {/* YouTube logo badge */}
        {video.youtubeId && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-8 h-5" viewBox="0 0 90 20" fill="none">
              <path d="M27.97 3.77A3.58 3.58 0 0 0 25.48 1.2C23.25.6 14.5.6 14.5.6s-8.75 0-10.98.6A3.58 3.58 0 0 0 1.03 3.77C.45 6.04.45 10.7.45 10.7s0 4.67.58 6.93a3.58 3.58 0 0 0 2.49 2.57c2.23.6 10.98.6 10.98.6s8.75 0 10.98-.6a3.58 3.58 0 0 0 2.49-2.57c.58-2.26.58-6.93.58-6.93s0-4.66-.58-6.93z" fill="#FF0000"/>
              <path d="M11.73 14.36l7.27-3.66-7.27-3.66v7.32z" fill="#fff"/>
            </svg>
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-light transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-white/50 truncate max-w-[70%]">{video.channel}</p>
          {video.views && <p className="text-xs text-white/40">{video.views} views</p>}
        </div>
      </div>
    </div>
  )
}
