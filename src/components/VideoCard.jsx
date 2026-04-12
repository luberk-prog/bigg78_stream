export default function VideoCard({ video, onClick }) {
  const isWatchTogether = !!video.host;

  return (
    <div 
      onClick={() => onClick(video)}
      className="group relative flex flex-col cursor-pointer active:scale-[0.98] transition-all duration-500 glass-card p-0 overflow-hidden border border-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl hover:shadow-brand/20 animate-fade-in"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-video overflow-hidden bg-black/40">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
           <div className="absolute inset-0 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-2xl shadow-brand/40 scale-90 group-hover:scale-100 transition-transform duration-500 border border-white/20">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M7 6v12l10-6z" /></svg>
              </div>
           </div>
        </div>

        {/* Video Duration Badge */}
        <div className="absolute bottom-3 right-3 glass-dark px-2 py-1 rounded-md text-[10px] font-black tracking-widest text-white/90 border border-white/5">
          {video.duration || '12:45'}
        </div>

        {/* Live / Watch Together Status */}
        {isWatchTogether && (
           <div className="absolute top-3 left-3 flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-brand/50 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-brand shadow-[0_0_8px_white]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white leading-none">In Progress</span>
           </div>
        )}
      </div>

      {/* Info Area */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-sm font-bold text-white group-hover:text-brand-light transition-colors line-clamp-2 leading-tight flex-1">
            {video.title}
          </h3>
          <button className="text-white/20 hover:text-white transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 mb-3">
             <div className="w-5 h-5 rounded-full bg-brand/20 flex items-center justify-center overflow-hidden border border-white/10">
                <img src={`https://i.pravatar.cc/50?u=${video.channel}`} alt="" className="w-full h-full object-cover opacity-60" />
             </div>
             <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">{video.channel}</span>
          </div>

          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                <span>{video.views || '1M'} Views</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span>{video.date || '2d ago'}</span>
             </div>
             {isWatchTogether && (
                <div className="text-[9px] font-black uppercase tracking-widest text-brand-light bg-brand/5 px-2 py-1 rounded border border-brand/20">
                  {video.host} Rooms
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
