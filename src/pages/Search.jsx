import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopToolbar from '../components/TopToolbar'
import VideoCard from '../components/VideoCard'
import { searchYouTube, getTrending, hasApiKey } from '../lib/youtube'
import { mockVideos } from '../data/mockVideos'

const CATEGORIES = ['Trending', 'Gaming', 'Music', 'Live', 'News', 'Tech']

export default function Search() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const [activeTab, setActiveTab] = useState('Trending')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [apiError, setApiError] = useState('')
  const [nextPageToken, setNextPageToken] = useState('')
  const observerTarget = useRef(null)

  const doSearch = useCallback(async (q, isLoadMore = false) => {
    if (isLoadMore && !nextPageToken) return
    
    setApiError('')
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      if (!hasApiKey()) {
        if (!isLoadMore) setVideos(mockVideos)
        setLoading(false)
        return
      }
      
      const res = q.trim() 
        ? await searchYouTube(q, 24, isLoadMore ? nextPageToken : '')
        : await getTrending(24, isLoadMore ? nextPageToken : '')
      
      if (isLoadMore) {
        setVideos(prev => [...prev, ...res.items])
      } else {
        setVideos(res.items)
      }
      setNextPageToken(res.nextPageToken || '')
    } catch (err) {
      setApiError(`Couldn't load results: ${err.message}`)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [nextPageToken])

  useEffect(() => {
    doSearch(query)
  }, [query])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextPageToken && !loadingMore && !loading) {
          doSearch(query, true)
        }
      },
      { threshold: 1.0 }
    )
    if (observerTarget.current) observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [nextPageToken, loadingMore, loading, query, doSearch])

  return (
    <div className="min-h-screen cinematic-bg text-white relative">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-none" />
      
      <Sidebar />
      <TopToolbar />

      <main className="relative z-10 pl-32 pr-12 pt-32 pb-12 transition-all duration-700 max-w-[1920px] mx-auto">
        {/* Results Header */}
        <div className="mb-10 animate-fade-in-up">
           <h1 className="text-3xl font-black tracking-tight mb-2">
             {query ? `Results for "${query}"` : 'Explore Trending'}
           </h1>
           <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
             {loading ? 'Scanning YouTube...' : `${videos.length} videos curated for you`}
           </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-3 mb-12 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeTab === cat
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20'
                  : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Grid */}
        {loading && !videos.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[2.5rem] aspect-video bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 animate-fade-in">
            {videos.map((v, i) => (
              <VideoCard 
                key={`${v.id}-${i}`} 
                video={v} 
                onClick={(v) => navigate(`/watch/${v.youtubeId || v.id}`)} 
              />
            ))}
          </div>
        )}

        {/* Infinite Scroll Anchor */}
        <div ref={observerTarget} className="h-40 flex items-center justify-center mt-12">
          {loadingMore && (
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border border-white/10 animate-fade-in">
              <div className="w-2 h-2 rounded-full bg-brand animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0.4s' }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Fetching more excellence</span>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
