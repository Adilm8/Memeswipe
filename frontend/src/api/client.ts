export const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchWithSession(endpoint: string, options: RequestInit = {}) {
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
  
  return response.json();
}

export const client = {
  get: <T>(endpoint: string) => fetchWithSession(endpoint, { method: 'GET' }) as Promise<T>,
  post: <T>(endpoint: string, data?: any) => fetchWithSession(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
  delete: <T>(endpoint: string) => fetchWithSession(endpoint, { method: 'DELETE' }) as Promise<T>
};
