export interface Meme {
  id: string;
  title: string;
  image_url: string;
  source: string;
  upvotes: number;
  likes_count: number;
  dislikes_count: number;
}

export interface Session {
  session_token: string;
  user_id: string;
  nickname: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  nickname: string;
  total_swipes: number;
  total_likes: number;
  total_dislikes: number;
  total_saves: number;
  like_ratio: number;
  created_at: string;
}

export interface Match {
  user_id: string;
  nickname: string;
  similarity_score: number;
  shared_memes_count: number;
  shared_memes: Meme[];
}

export interface SavedMeme {
  id: string;
  meme: Meme;
  saved_at: string;
}

export type SwipeAction = 'like' | 'dislike';

export interface HumorProfile {
  profile: string;
  top_categories: string[];
  humor_style: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}
