import { useState, useCallback } from 'react';

const HISTORY_KEY = 'bigg78_watch_history_v2';
const FAVORITES_KEY = 'bigg78_favorites';

/**
 * Tracks the user's watch history and favorite videos.
 */
export function useWatchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addToHistory = useCallback((video, lastPosition = 0) => {
    if (!video || (!video.id && !video.youtubeId)) return;
    setHistory((prev) => {
      const videoId = video.youtubeId || video.id;
      const filtered = prev.filter(item => (item.youtubeId || item.id) !== videoId);
      const newItem = { ...video, lastPosition, updatedAt: new Date().toISOString() };
      const newHistory = [newItem, ...filtered].slice(0, 20);
      saveToStorage(HISTORY_KEY, newHistory);
      return newHistory;
    });
  }, []);

  const toggleFavorite = useCallback((video) => {
    if (!video) return;
    setFavorites((prev) => {
      const videoId = video.youtubeId || video.id;
      const exists = prev.find(item => (item.youtubeId || item.id) === videoId);
      let newFavorites;
      if (exists) {
        newFavorites = prev.filter(item => (item.youtubeId || item.id) !== videoId);
      } else {
        newFavorites = [{ ...video, addedAt: new Date().toISOString() }, ...prev];
      }
      saveToStorage(FAVORITES_KEY, newFavorites);
      return newFavorites;
    });
  }, []);

  const isFavorite = useCallback((videoId) => {
    return favorites.some(item => (item.youtubeId || item.id) === videoId);
  }, [favorites]);

  const updateProgress = useCallback((videoId, lastPosition) => {
    setHistory((prev) => {
      const newHistory = prev.map(item => {
        if ((item.youtubeId || item.id) === videoId) {
          return { ...item, lastPosition, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      saveToStorage(HISTORY_KEY, newHistory);
      return newHistory;
    });
  }, []);

  const getRecommendationQuery = useCallback(() => {
    if (history.length === 0) return '';
    const keywords = history.slice(0, 3)
      .map(v => v.title.split(' ').slice(0, 2).join(' '))
      .join('|');
    return keywords;
  }, [history]);

  return { history, favorites, toggleFavorite, isFavorite, addToHistory, updateProgress, getRecommendationQuery };
}
