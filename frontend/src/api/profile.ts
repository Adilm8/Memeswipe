import { client } from './client';
import { Profile, Match } from './types';

export interface ProfileUpdateParams {
  nickname?: string;
  bio?: string;
  avatar_url?: string;
}

export const fetchProfile = () => client.get<Profile>('/api/profile');
export const updateProfile = (data: ProfileUpdateParams) => client.patch<Profile>('/api/profile', data);
export const fetchMatches = () => client.get<Match[]>('/api/profile/matches');

