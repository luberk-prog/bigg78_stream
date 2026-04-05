import { useState, useCallback } from 'react';

const STORAGE_KEY = 'bigg78_watch_history';

/**
 * Tracks the user's localized watch history to power intelligent recommendations without requiring an account.
 */
export function useWatchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((video) => {
    if (!video || !video.title) return;

    setHistory((prev) => {
      // Extract relevant phrasing by merging the title and the channel names
      const rawText = `${video.title} ${video.channel || ''}`;
      
      // Perform primitive text filtering (drop special characters, strip short pronouns)
      const words = rawText
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      // Append the newly derived keywords onto existing history arrays unconditionally
      let newHistory = [...words, ...prev];
      
      // Enforce an absolute deduplication of any redundant words using a Set
      newHistory = [...new Set(newHistory)];
      
      // Aggressively slice out only the top 15 most recent words to keep the query compact for standard limits
      newHistory = newHistory.slice(0, 15);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const getRecommendationQuery = useCallback(() => {
    if (history.length === 0) return '';
    // Select the absolute top 4 algorithmic buzzwords, pipe separating them for YouTube's Boolean logical "OR"
    return history.slice(0, 4).join('|');
  }, [history]);

  return { history, addToHistory, getRecommendationQuery };
}
