export default function MessageBubble({ message }) {
  const { user, avatar, text, time, isOwn } = message

  if (isOwn) {
    return (
      <div className="flex justify-end gap-2 group">
        <div className="max-w-[75%]">
          <div className="bg-brand text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm shadow-lg shadow-brand/20">
            {text}
          </div>
          <p className="text-xs text-white/30 mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            {time}
          </p>
        </div>
        <img
          src={avatar}
          alt={user}
          className="w-7 h-7 rounded-full object-cover shrink-0 mt-auto border border-brand/40"
        />
      </div>
    )
  }

  return (
    <div className="flex gap-2 group">
      <img
        src={avatar}
        alt={user}
        className="w-7 h-7 rounded-full object-cover shrink-0 mt-auto border border-white/10"
      />
      <div className="max-w-[75%]">
        <p className="text-xs text-white/40 mb-1 ml-1">{user}</p>
        <div className="bg-dark-500 text-white/90 text-sm px-3 py-2 rounded-2xl rounded-tl-sm border border-white/5">
          {text}
        </div>
        <p className="text-xs text-white/30 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {time}
        </p>
      </div>
    </div>
  )
}
