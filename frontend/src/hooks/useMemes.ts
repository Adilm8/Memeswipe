import { useState, useEffect, useCallback, useRef } from 'react';
import { Meme } from '@/api/types';
import { fetchFeed } from '@/api/memes';
import { useSession } from '@/hooks/useSession';

export const useMemes = () => {
  const { session } = useSession();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const loadMemes = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      const feed = await fetchFeed(20);
      setMemes(prev => {
        // Deduplicate memes by id
        const existingIds = new Set(prev.map(m => m.id));
        const newMemes = feed.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMemes];
      });
    } catch (e) {
      console.error('Failed to load memes:', e);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial load once session is ready
  useEffect(() => {
    if (session && memes.length === 0 && !loadingRef.current) {
      loadMemes();
    }
  }, [session, memes.length, loadMemes]);

  // Auto-refetch when stack is running low
  useEffect(() => {
    if (session && memes.length < 5 && memes.length > 0 && !loadingRef.current) {
      loadMemes();
    }
  }, [session, memes.length, loadMemes]);

  // Preload next 2 images for instant display
  useEffect(() => {
    const topMemes = memes.slice(-3);
    topMemes.forEach(meme => {
      const img = new Image();
      img.src = meme.image_url;
    });
  }, [memes]);

  const removeMeme = (id: string) => {
    setMemes(prev => prev.filter(m => m.id !== id));
  };

  return {
    memes,
    isLoading: isLoading || (!session && memes.length === 0),
    isEmpty: memes.length === 0 && !isLoading && !!session,
    removeMeme
  };
};
