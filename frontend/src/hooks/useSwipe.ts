import { useState } from 'react';
import { swipeMeme, saveMeme } from '@/api/memes';
import { SwipeAction } from '@/api/types';
import { useSession } from './useSession';

export const useSwipe = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { incrementLikes } = useSession();

  const handleSwipe = async (memeId: string, action: SwipeAction) => {
    setIsProcessing(true);
    try {
      if (action === 'like') {
        incrementLikes();
      }
      await swipeMeme(memeId, action);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (memeId: string) => {
    setIsProcessing(true);
    try {
      await saveMeme(memeId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleSwipe, handleSave, isProcessing };
};
