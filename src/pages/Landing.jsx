import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Watch Together',
    desc: 'Sync playback with friends in real-time — everyone sees the same frame.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Live Chat',
    desc: 'React instantly with your crew using messages, emojis, and reactions.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Private Rooms',
    desc: 'Create invite-only spaces — your party, your rules.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Curated Content',
    desc: 'Trending, recommended, and queued videos tailored to your taste.',
  },
]

const floatingTitles = [
  'Avengers: Endgame',
  'The Dark Knight',
  'Inception',
  'Interstellar',
  'Spider-Man: No Way Home',
  'Dune Part Two',
]

export default function Landing() {
  const [currentTitle, setCurrentTitle] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitle(prev => (prev + 1) % floatingTitles.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 particles-bg overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-accent-pink flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-gradient">Bigg78</span>
              <span className="text-white"> Stream</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/signup" className="btn-primary text-sm px-5 py-2.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-accent-pink/8 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[250px] h-[250px] rounded-full bg-accent-cyan/6 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 text-sm text-brand mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Now Watching: <span className="font-semibold transition-all duration-500">{floatingTitles[currentTitle]}</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            <span className="text-white">Watch movies </span>
            <span className="text-gradient">together.</span>
            <br />
            <span className="text-white/80 text-4xl sm:text-5xl font-bold">Anywhere. Anytime.</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            The ultimate watch-party platform. Create a room, invite your friends,
            and experience cinema together — no matter where you are in the world.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary text-base px-8 py-4 rounded-xl shadow-xl shadow-brand/30 hover:scale-105 transition-transform">
              Start Watching Free
              <svg className="inline ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link to="/dashboard" className="btn-secondary text-base px-8 py-4 rounded-xl hover:scale-105 transition-transform">
              Browse Content
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 mt-12 text-white/40 text-sm">
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <img key={i} src={`https://picsum.photos/seed/user${i}/40/40`} alt="" className="w-8 h-8 rounded-full border-2 border-dark-900 object-cover" />
              ))}
            </div>
            <span><strong className="text-white">12,000+</strong> active watch parties today</span>
          </div>
        </div>

        {/* Hero preview card */}
        <div className="relative z-10 mt-16 max-w-3xl w-full mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-dark-800">
            <div className="aspect-video bg-gradient-to-br from-dark-700 to-dark-900 flex items-center justify-center relative overflow-hidden">
              <img
                src="https://picsum.photos/seed/avengers/900/500"
                alt="Watch Party Preview"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 video-overlay" />
              {/* Fake player controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-1 bg-white/20 rounded-full mb-3">
                  <div className="h-full w-2/5 bg-brand rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <button className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-dark-900 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </button>
                  <span className="text-white text-sm font-mono">45:12 / 2:32:00</span>
                  <span className="ml-auto flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    4 watching live
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Floating chat bubbles */}
          <div className="absolute -right-4 top-8 bg-dark-700/90 backdrop-blur text-white text-xs px-3 py-2 rounded-xl border border-white/10 shadow-xl animate-bounce" style={{animationDuration:'3s'}}>
            🔥 This scene is incredible!!
          </div>
          <div className="absolute -left-4 bottom-20 bg-brand/20 backdrop-blur text-white text-xs px-3 py-2 rounded-xl border border-brand/30 shadow-xl animate-bounce" style={{animationDuration:'4s', animationDelay:'0.5s'}}>
            😂 No spoilers please!
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need for the ultimate <span className="text-gradient">watch party</span></h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">Built for groups who love movies. Packed with features to make every watch session unforgettable.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card-glass p-6 hover-card group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 group-hover:bg-brand/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-accent-pink/80 to-accent-cyan/60" />
          <div className="absolute inset-0 bg-mesh opacity-50" />
          <div className="relative z-10 text-center py-16 px-8">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">Ready to watch together?</h2>
            <p className="text-white/80 text-lg mb-8">Join thousands of groups streaming their favorite content right now.</p>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-brand font-bold px-8 py-4 rounded-xl hover:scale-105 transition-transform shadow-xl">
              Create Your Room Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-white/30 text-sm">
        <p>© 2025 Bigg78 Stream. Built for movie lovers. 🎬</p>
      </footer>
    </div>
  )
}
