import { auth } from './firebase';
import type { User } from 'firebase/auth';

async function getIdToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const user = auth.currentUser as User | null;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (e) {
    return null;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

async function request(path: string, opts: RequestInit = {}) {
  const token = await getIdToken();
  const headers = new Headers(opts.headers as HeadersInit || {});
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers, credentials: 'include' });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const error = (body && body.error) || res.statusText || 'Request failed';
    throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
  }

  return body;
}

export const api = {
  get: (path: string, opts: RequestInit = {}) => request(path, { method: 'GET', ...opts }),
  post: (path: string, data?: unknown, opts: RequestInit = {}) => request(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts }),
  put: (path: string, data?: unknown, opts: RequestInit = {}) => request(path, { method: 'PUT', body: data ? JSON.stringify(data) : undefined, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts }),
  delete: (path: string, opts: RequestInit = {}) => request(path, { method: 'DELETE', ...opts }),
};

export default api;
