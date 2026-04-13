import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, logout } = useAuth()
  
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    photoURL: user?.photoURL || ''
  })
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess('')
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800))
    
    const updates = {
      name: form.name,
      email: form.email,
      photoURL: form.photoURL
    }
    
    updateUser(updates)
    setLoading(false)
    setSuccess('Profile updated successfully.')
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
      logout()
      navigate('/login')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen cinematic-bg text-white relative">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-[4px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <nav className="relative z-50 h-20 flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Settings</h2>
            <p className="text-sm font-bold truncate max-w-[300px] leading-tight">Account Profile</p>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto pt-10 pb-20 px-6 animate-fade-in-up">
        
        <div className="flex flex-col md:flex-row items-start gap-12">
          
          {/* Avatar Panel */}
          <div className="w-full md:w-1/3 flex flex-col items-center">
            <div className="w-48 h-48 rounded-[2rem] overflow-hidden shadow-3xl border-2 border-white/10 relative group mb-6 bg-black/40">
               {form.photoURL || user?.photoURL ? (
                 <img src={form.photoURL || user.photoURL} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-6xl font-black text-brand-light italic">
                   {user?.name?.[0] || user?.email?.[0] || 'G'}
                 </div>
               )}
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               </div>
            </div>
            
            <div className="w-full space-y-4">
               <button 
                 onClick={handleLogout}
                 className="w-full glass py-3 rounded-2xl flex items-center justify-center gap-3 font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all border border-white/10"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Sign Out
               </button>
               
               <button 
                 onClick={handleDeleteAccount}
                 className="w-full py-3 rounded-2xl flex items-center justify-center gap-3 font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 Delete Account
               </button>
            </div>
          </div>
          
          {/* Settings Form */}
          <div className="w-full md:w-2/3 glass-card p-10 border border-white/10 shadow-3xl">
            <h2 className="text-3xl font-black mb-8 tracking-tight">Account Settings</h2>
            
            {success && (
              <div className="mb-8 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {success}
              </div>
            )}
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Username</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="Cinematic Viewer"
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
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">New Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="Leave blank to keep unchanged"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Avatar URL</label>
                <input
                  type="url"
                  value={form.photoURL}
                  onChange={e => setForm(p => ({ ...p, photoURL: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-brand text-white font-black px-10 py-4 rounded-2xl hover:bg-brand-light active:scale-95 transition-all shadow-[0_20px_50px_rgba(124,58,237,0.2)] flex items-center justify-center gap-3 w-fit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Save Changes
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
