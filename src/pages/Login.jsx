import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    // Simulate auth delay
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-black overflow-hidden">
      {/* Cinematic Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 opacity-60"
        style={{ backgroundImage: `url('https://i.pinimg.com/1200x/73/9a/15/739a15f89a6c439077ed7eae16b555e4.jpg')` }}
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/20 via-black/40 to-black/80 backdrop-blur-[2px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-3 mb-8 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-2xl shadow-brand/40 group-hover:scale-110 transition-transform">
               <span className="text-white font-black text-2xl italic">B</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">Bigg78 <span className="text-brand">Stream</span></span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Welcome back</h1>
          <p className="text-white/40 mt-2 text-sm font-bold uppercase tracking-widest">Sign in to your premium account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-10 border border-white/10 shadow-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                placeholder="you@cinematic.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Password</label>
                <button type="button" className="text-[10px] font-black text-brand uppercase tracking-widest hover:text-brand-light transition-colors">Forgot?</button>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 rounded-[1.5rem] hover:bg-white/90 active:scale-95 transition-all shadow-2xl shadow-white/10 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : 'Sign In'}
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
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand hover:text-brand-light transition-colors font-black uppercase tracking-widest text-[11px] ml-1">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
