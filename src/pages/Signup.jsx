import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    navigate('/dashboard')
  }

  const perks = [
    'Unlimited watch parties',
    'HD & 4K streaming',
    'Live room chat',
    'No credit card required',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left promo panel: Cinematic & Professional */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-20 relative overflow-hidden active:scale-[0.98] transition-transform duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/40 via-transparent to-brand/10 pointer-events-none" />
        
        <div className="relative z-10 animate-fade-in-up">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 mb-20 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-2xl shadow-brand/40 group-hover:scale-110 transition-transform">
               <span className="text-white font-black text-2xl italic">B</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Bigg78 <span className="text-brand">Stream</span></span>
          </div>

          <h2 className="text-5xl font-black text-white leading-[1] mb-6 tracking-tighter">
            Your movie night,<br /><span className="text-brand">reimagined.</span>
          </h2>
          <p className="text-white/40 text-lg mb-12 max-w-sm font-medium">Everything you need for the ultimate premium watch party experience.</p>

          <ul className="space-y-6">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-4 text-white/70 font-bold tracking-tight">
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel: Glass Card Container */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight">Create your account</h1>
            <p className="text-white/40 mt-2 text-sm font-bold uppercase tracking-widest">Free forever. No card required.</p>
          </div>

          <div className="glass-card p-10 border border-white/10 shadow-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="Alex Johnson"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="you@cinematic.com"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black py-4 rounded-[1.5rem] hover:bg-white/90 active:scale-95 transition-all shadow-2xl shadow-white/10 flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Create Free Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <GoogleLoginButton />
          </div>

          <p className="text-center text-white/40 text-sm mt-8 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-brand-light transition-colors font-black uppercase tracking-widest text-[11px] ml-1">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
