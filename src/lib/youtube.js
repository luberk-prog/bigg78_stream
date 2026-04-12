/**
 * YouTube Data API v3 helpers
 * API key loaded from .env: VITE_YOUTUBE_API_KEY
 */

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

/**
 * Normalize a YouTube search result or video item into our app's shape
 */
function normalizeSearchItem(item) {
  const videoId = item.id?.videoId || item.id
  const snippet = item.snippet || {}
  return {
    id: videoId,
    youtubeId: videoId,
    title: snippet.title || 'Untitled',
    channel: snippet.channelTitle || 'Unknown Channel',
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      snippet.thumbnails?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: snippet.publishedAt || '',
    description: snippet.description || '',
    // Duration and views are not returned by search endpoint — fetched separately when needed
    duration: '',
    views: '',
    category: 'search',
  }
}

function normalizeVideoItem(item) {
  const videoId = typeof item.id === 'string' ? item.id : item.id?.videoId
  const snippet = item.snippet || {}
  const stats = item.statistics || {}
  const views = stats.viewCount
    ? formatViews(parseInt(stats.viewCount, 10))
    : ''
  const duration = item.contentDetails?.duration
    ? parseDuration(item.contentDetails.duration)
    : ''

  return {
    id: videoId,
    youtubeId: videoId,
    title: snippet.title || 'Untitled',
    channel: snippet.channelTitle || 'Unknown Channel',
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt: snippet.publishedAt || '',
    description: snippet.description || '',
    duration,
    views,
    category: 'trending',
  }
}

/** Parse ISO 8601 duration (PT1H2M3S) to human-readable string */
function parseDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''
  const h = match[1] ? parseInt(match[1]) : 0
  const m = match[2] ? parseInt(match[2]) : 0
  const s = match[3] ? parseInt(match[3]) : 0
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format view count to abbreviated string (e.g. 1,234,567 → 1.2M) */
function formatViews(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

/**
 * Search YouTube videos by query
 * @param {string} query
 * @param {number} maxResults
 * @param {string} pageToken
 * @returns {Promise<{items: Array, nextPageToken: string}>}
 */
export async function searchYouTube(query, maxResults = 24, pageToken = '') {
  if (!API_KEY || API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    throw new Error('NO_API_KEY')
  }
  if (!query?.trim()) return { items: [], nextPageToken: '' }

  const url = new URL(`${BASE_URL}/search`)
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', query.trim())
  url.searchParams.set('type', 'video')
  url.searchParams.set('videoEmbeddable', 'true') // Strictly enforce
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('safeSearch', 'moderate')
  url.searchParams.set('key', API_KEY)
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return {
    items: (data.items || []).map(normalizeSearchItem),
    nextPageToken: data.nextPageToken || ''
  }
}

/**
 * Get trending / most popular videos
 * @param {number} maxResults
 * @param {string} pageToken
 * @param {string} regionCode
 * @returns {Promise<{items: Array, nextPageToken: string}>}
 */
export async function getTrending(maxResults = 24, pageToken = '', regionCode = 'US') {
  if (!API_KEY || API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    throw new Error('NO_API_KEY')
  }

  const url = new URL(`${BASE_URL}/videos`)
  url.searchParams.set('part', 'snippet,contentDetails,statistics')
  url.searchParams.set('chart', 'mostPopular')
  url.searchParams.set('regionCode', regionCode)
  url.searchParams.set('videoEmbeddable', 'true') // Strictly enforce where possible
  url.searchParams.set('maxResults', String(maxResults))
  url.searchParams.set('key', API_KEY)
  if (pageToken) url.searchParams.set('pageToken', pageToken)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }
  const data = await res.json()
  return {
    items: (data.items || []).map(normalizeVideoItem),
    nextPageToken: data.nextPageToken || ''
  }
}

/**
 * Get details for a single video by ID
 * @param {string} videoId
 * @returns {Promise<Object|null>} normalized video object
 */
export async function getVideoById(videoId) {
  if (!API_KEY || API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    throw new Error('NO_API_KEY')
  }

  const url = new URL(`${BASE_URL}/videos`)
  url.searchParams.set('part', 'snippet,contentDetails,statistics')
  url.searchParams.set('id', videoId)
  url.searchParams.set('key', API_KEY)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${res.status}`)
  }
  const data = await res.json()
  const items = data.items || []
  return items.length > 0 ? normalizeVideoItem(items[0]) : null
}

/** Returns true if the API key is configured */
export function hasApiKey() {
  return Boolean(API_KEY) && API_KEY !== 'YOUR_YOUTUBE_API_KEY_HERE'
}
