import { client } from './client';
import { HumorProfile } from './types';

export const fetchHumorProfile = () => client.get<HumorProfile>('/api/ai/humor-profile');
export const explainMeme = (memeId: string) => client.post<{explanation: string}>(`/api/ai/explain`, { meme_id: memeId }).then(res => res.explanation);
export const chatWithAI = (message: string, memeId?: string) => client.post<{reply: string}>('/api/ai/chat', { message, meme_id: memeId }).then(res => res.reply);
