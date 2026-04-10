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
      className={`${sizeClasses[size]} shrink-0 cursor-pointer group hover-card animate-fade-in-up`}
    >
      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden aspect-video bg-dark-600">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={e => { e.target.src = `https://picsum.photos/seed/${video.id}/480/270` }}
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center scale-75 group-hover:scale-100 transition-all shadow-2xl">
            <svg className="w-5 h-5 text-dark-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
          <button 
            onClick={handleWatchTogether}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white px-4 py-1.5 rounded-full text-xs font-bold transition-transform shadow-lg cursor-pointer transform hover:scale-105"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Watch Together
          </button>
        </div>
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
