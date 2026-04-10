import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VideoCard from '../components/VideoCard'
import { searchYouTube, getTrending, hasApiKey } from '../lib/youtube'
import { mockVideos } from '../data/mockVideos'

const CATEGORIES = ['All', 'Movies', 'Gaming', 'Music', 'News', 'Sports', 'Technology']

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="w-full">
          <div className="rounded-xl aspect-video skeleton" />
          <div className="mt-2.5 space-y-2">
            <div className="h-3 skeleton rounded w-5/6" />
            <div className="h-3 skeleton rounded w-3/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ApiBanner({ message, type = 'warning' }) {
  const colors = type === 'error'
    ? 'bg-red-500/10 border-red-500/20 text-red-300'
    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
  return (
    <div className={`flex items-center gap-3 ${colors} border text-sm px-4 py-3 rounded-xl mb-6`}>
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [activeTab, setActiveTab] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const debounceRef = useRef(null)

  const doSearch = useCallback(async (q) => {
    setApiError('')
    setLoading(true)
    try {
      if (!hasApiKey()) {
        throw new Error('NO_API_KEY')
      }
      let results
      if (q.trim()) {
        results = await searchYouTube(q, 24)
      } else {
        results = await getTrending(24)
      }
      setVideos(results)
    } catch (err) {
      if (err.message === 'NO_API_KEY') {
        setApiError('YouTube API key not set. Add VITE_YOUTUBE_API_KEY to your .env file. Showing mock content.')
        // Fall back to mock data filtered by query
        const mock = query
          ? mockVideos.filter(v =>
            v.title.toLowerCase().includes(query.toLowerCase()) ||
            v.channel.toLowerCase().includes(query.toLowerCase())
          )
          : mockVideos
        setVideos(mock)
      } else {
        setApiError(`Couldn't load results: ${err.message}`)
        setVideos(mockVideos)
      }
    } finally {
      setLoading(false)
    }
  }, [query])

  // Debounce search when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, doSearch])

  // Apply client-side sort
  const sortedVideos = [...videos].sort((a, b) => {
    if (sortBy === 'views') {
      const av = parseFloat(a.views) || 0
      const bv = parseFloat(b.views) || 0
      return bv - av
    }
    return 0
  })

  const trendingTags = ['Avengers', 'Gaming', 'Music', 'Science', 'Sports', 'Comedy', 'News', 'Travel']

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-6 pt-24 pb-12">

        {/* Header */}
        <div className="mb-8">
          {query ? (
            <div>
              <h1 className="text-2xl font-bold text-white">
                Results for <span className="text-gradient">"{query}"</span>
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {loading ? 'Searching…' : `${sortedVideos.length} videos found`}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-white">
                {hasApiKey() ? <>Trending on <span className="text-gradient">YouTube</span></> : <>Browse <span className="text-gradient">All Content</span></>}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {loading ? 'Loading…' : `${sortedVideos.length} videos`}
              </p>
            </div>
          )}
        </div>

        {/* API warning */}
        {apiError && <ApiBanner message={apiError} />}

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === cat
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-brand/50 cursor-pointer"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="views">Sort: Most Viewed</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <SkeletonGrid />
        ) : sortedVideos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {sortedVideos.map((v, i) => (
              <div key={v.youtubeId || v.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <VideoCard video={v} size="md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">
              We couldn't find anything matching "{query}". <br />
              Try different keywords or browse our trending content.
            </p>
            <button 
              onClick={() => doSearch('')}
              className="mt-8 btn-secondary px-6 py-2.5 text-sm"
            >
              View Trending
            </button>
          </div>
        )}

        {/* Trending tags (shown when no query) */}
        {!query && !loading && (
          <div className="mt-16">
            <h2 className="section-title">🔥 Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map(tag => (
                <a
                  key={tag}
                  href={`/search?q=${tag}`}
                  className="px-4 py-2 bg-dark-700 border border-white/10 rounded-full text-sm text-white/60 hover:text-white hover:border-brand/40 hover:bg-brand/10 transition-all"
                >
                  #{tag}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
