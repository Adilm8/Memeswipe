import { client } from './client';
import { UserSearchResult, FriendItem, ChatMessage, Conversation } from './types';

export const searchUsers = (q: string): Promise<UserSearchResult[]> =>
  client.get<UserSearchResult[]>(`/api/friends/search?q=${encodeURIComponent(q)}`);

export const fetchFriends = (): Promise<FriendItem[]> =>
  client.get<FriendItem[]>('/api/friends');

export const addFriend = (userId: string): Promise<{ status: string; message: string }> =>
  client.post<{ status: string; message: string }>(`/api/friends/${userId}`);

export const removeFriend = (userId: string): Promise<{ status: string; message: string }> =>
  client.delete<{ status: string; message: string }>(`/api/friends/${userId}`);

export const fetchConversations = (): Promise<Conversation[]> =>
  client.get<Conversation[]>('/api/chat/conversations');

export const fetchMessages = (friendId: string): Promise<ChatMessage[]> =>
  client.get<ChatMessage[]>(`/api/chat/${friendId}`);

export const sendMessage = (
  friendId: string,
  content: string,
  memeId?: string | null
): Promise<{ status: string; message_id: string }> =>
  client.post<{ status: string; message_id: string }>(`/api/chat/${friendId}`, {
    content,
    meme_id: memeId || null,
  });
