import { client } from './client';
import { Session } from './types';

export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export const registerUser = (params: RegisterParams) =>
  client.post<Session>('/api/auth/register', params);

export const loginUser = (params: LoginParams) =>
  client.post<Session>('/api/auth/login', params);

export const createGuestSession = () =>
  client.post<Session>('/api/auth/guest');
