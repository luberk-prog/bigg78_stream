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
    <div className="min-h-screen bg-dark-900 particles-bg flex">
      {/* Left promo panel */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-accent-pink/10" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-brand/10 blur-[80px]" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-accent-pink flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span className="text-xl font-bold"><span className="text-gradient">Bigg78</span><span className="text-white"> Stream</span></span>
          </Link>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Your movie night,<br /><span className="text-gradient">reimagined.</span>
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-sm">Everything you need for the perfect watch party experience.</p>

          <ul className="space-y-4">
            {perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {perk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-accent-pink flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              </div>
              <span className="text-xl font-bold"><span className="text-gradient">Bigg78</span><span className="text-white"> Stream</span></span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-white/50 mt-1 text-sm">Free forever. No credit card needed.</p>
          </div>

          <div className="card-glass p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="Alex Johnson"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field"
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-base mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Free Account
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex flex-col gap-3">
              <GoogleLoginButton />
            </div>

            <p className="text-center text-white/30 text-xs mt-5">
              By signing up you agree to our{' '}
              <span className="text-brand cursor-pointer hover:underline">Terms of Service</span>{' '}
              and{' '}
              <span className="text-brand cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>

          <p className="text-center text-white/40 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-brand-light transition-colors font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
