import { client } from './client';
import { Session } from './types';

export const createSession = () => client.post<Session>('/api/session');
export const validateSession = () => client.get<Session>('/api/session/me');
// Uses X-Session-Token header (auto-injected by client.ts) for validation
