export const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchWithSession<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('session_token');
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('X-Session-Token', token);
  }
  headers.set('Content-Type', 'application/json');

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const client = {
  get: <T>(endpoint: string) => fetchWithSession<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, data?: any) => fetchWithSession<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => fetchWithSession<T>(endpoint, { method: 'DELETE' })
};
