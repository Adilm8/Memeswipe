import { client } from './client';
import { HumorProfile } from './types';

export interface AIResponseData {
  response: string;
}

export const fetchHumorProfile = () => client.get<HumorProfile>('/api/ai/humor-profile');

export const explainMeme = (memeId: string) => 
  client.post<AIResponseData>('/api/ai/explain', { message: 'Explain', meme_id: memeId })
    .then(res => res.response);

export const chatWithAI = (message: string, memeId?: string) => 
  client.post<AIResponseData>('/api/ai/chat', { message, meme_id: memeId })
    .then(res => res.response);

