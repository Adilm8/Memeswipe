import { client } from './client';
import { Meme, SavedMeme, SwipeAction } from './types';

export const fetchFeed = (count: number = 20) => client.get<Meme[]>(`/api/memes/feed?count=${count}`);
export const swipeMeme = (memeId: string, action: SwipeAction) => client.post<Meme>(`/api/memes/${memeId}/swipe`, { action });
export const saveMeme = (memeId: string) => client.post<SavedMeme>(`/api/memes/${memeId}/save`);
export const unsaveMeme = (memeId: string) => client.delete<void>(`/api/memes/${memeId}/save`);
export const fetchSaved = () => client.get<SavedMeme[]>('/api/memes/saved');
