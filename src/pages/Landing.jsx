import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FeatureCard = ({ title, desc, icon }) => (
  <div className="glass-card p-10 flex flex-col items-center text-center border border-white/10 hover:bg-white/10 transition-all duration-500 group">
    <div className="w-16 h-16 rounded-3xl bg-brand/10 flex items-center justify-center mb-8 border border-brand/20 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-black mb-4 tracking-tight">{title}</h3>
    <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
  </div>
)

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  if (user) navigate('/dashboard')

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-black">
      {/* Cinematic Background Image for Landing */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 opacity-60"
        style={{ backgroundImage: `url('https://i.pinimg.com/1200x/73/9a/15/739a15f89a6c439077ed7eae16b555e4.jpg')` }}
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/20 via-black/40 to-black/80 backdrop-blur-[2px]" />
      
      <main className="relative z-10">
        {/* Navigation */}
        <nav className="h-24 flex items-center justify-between px-12">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-2xl shadow-brand/40">
                <span className="text-white font-black text-xl">B</span>
             </div>
             <span className="text-xl font-black tracking-tighter uppercase italic">Bigg78 <span className="text-brand">Stream</span></span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="glass px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10 pointer-events-auto"
          >
            Sign In
          </button>
        </nav>

        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
          <div className="max-w-4xl animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-brand shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Cinematic Experience Redefined</span>
            </div>
            <h1 className="text-7xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] drop-shadow-2xl">
              Streaming <br /> Together. <span className="text-brand">Elevated.</span>
            </h1>
            <p className="text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the pinnacle of collaborative watching with a premium, glassmorphic interface designed for those who demand more from their entertainment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button 
                onClick={() => navigate('/signup')}
                className="bg-white text-black font-black px-12 py-5 rounded-[2rem] text-lg hover:bg-white/90 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.2)] pointer-events-auto"
              >
                Get Started Free
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="glass px-12 py-5 rounded-[2rem] text-lg font-bold border border-white/10 hover:bg-white/5 transition-all pointer-events-auto"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* How it Works Step-by-Step */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5 relative">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black mb-4 tracking-tight uppercase italic">How it <span className="text-brand">Works</span></h2>
            <p className="text-white/40 font-bold tracking-widest uppercase text-[10px]">Three steps to cinematic collaboration</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 relative px-10">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[40px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <div className="relative group text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-brand text-white font-black text-2xl flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-brand/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">1</div>
              <h3 className="text-xl font-black mb-4 tracking-tight">Select Content</h3>
              <p className="text-white/40 text-sm leading-relaxed">Browse millions of YouTube videos or search for your favorite trending content with zero effort.</p>
            </div>

            <div className="relative group text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-brand text-white font-black text-2xl flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-brand/40 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">2</div>
              <h3 className="text-xl font-black mb-4 tracking-tight">Host a Party</h3>
              <p className="text-white/40 text-sm leading-relaxed">Click 'Start Watch Party' to create a private, high-fidelity room with ultra-low latency synchronization.</p>
            </div>

            <div className="relative group text-center">
              <div className="w-20 h-20 rounded-[2.5rem] bg-brand text-white font-black text-2xl flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-brand/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">3</div>
              <h3 className="text-xl font-black mb-4 tracking-tight">Invite Friends</h3>
              <p className="text-white/40 text-sm leading-relaxed">Share the room code instantly. Chat, react, and experience every cinematic moment in perfect sync.</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-white/5">
          <FeatureCard 
            title="Glassmorphic Design"
            desc="A stunning, translucent interface inspired by the future of computing, optimized for cinematic clarity."
            icon={<svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          <FeatureCard 
            title="Real-time Sync"
            desc="Watch with friends across the globe with zero-latency synchronization powered by Advanced socket technology."
            icon={<svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <FeatureCard 
            title="Premium Player"
            desc="Control your experience with minimalist, sophisticated playback tools designed for distraction-free viewing."
            icon={<svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
        </section>

        {/* Footer */}
        <footer className="py-20 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-12 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
               <span className="text-xl font-black tracking-tighter uppercase italic">Bigg78 <span className="text-brand">Stream</span></span>
            </div>
            <div className="flex items-center gap-10 text-white/40 text-xs font-black uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">© 2026 Bigg78 Stream. Premium Edition.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
