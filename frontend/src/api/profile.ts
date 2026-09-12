import { client } from './client';
import { Profile, Match } from './types';

export const fetchProfile = () => client.get<Profile>('/api/profile');
export const fetchMatches = () => client.get<Match[]>('/api/profile/matches');
