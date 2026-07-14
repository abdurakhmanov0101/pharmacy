/**
 * Universal fetcher — both SSR and client-side compatible.
 * Returns a Response-like object with .ok, .json(), .status
 * On the server, it works without localStorage (token is null).
 * On the client, it reads JWT from localStorage.
 */
export const fetcher = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Auto-redirect to login on 401 (client-side only)
  if (!response.ok && (response.status === 401 || response.status === 403)) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
};

/**
 * SWR-compatible fetcher — returns parsed JSON directly.
 * Use this as the second argument to useSWR().
 */
export const swrFetcher = (url: string) => fetcher(url).then(r => r.json());

