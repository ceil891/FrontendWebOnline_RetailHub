const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Fast In-Memory Cache and In-Flight Request Deduplication for Web Online
const fetchCacheMap = new Map<string, { data: any; timestamp: number }>();
const inFlightFetchMap = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 15000; // 15 seconds TTL

export function clearApiCache() {
  fetchCacheMap.clear();
  inFlightFetchMap.clear();
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Invalidate cache on mutations
  if (!isGet) {
    clearApiCache();
  } else {
    const cacheKey = `GET:${endpoint}`;
    const cached = fetchCacheMap.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }

    // Deduplicate in-flight requests
    if (inFlightFetchMap.has(cacheKey)) {
      return inFlightFetchMap.get(cacheKey)!;
    }
  }

  const token = localStorage.getItem('access_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token && token !== 'session_token' ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };
  if (isFormData) {
    delete headers['Content-Type'];
    delete headers['content-type'];
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Clear all auth credentials and trigger logout / redirect to login page
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          localStorage.removeItem('user_profile');
          localStorage.removeItem('user');
          localStorage.removeItem('auth_user');
          
          window.dispatchEvent(new CustomEvent('auth:unauthorized', {
            detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
          }));
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const resultData = data.data !== undefined ? data.data : data;

      if (isGet) {
        fetchCacheMap.set(`GET:${endpoint}`, { data: resultData, timestamp: Date.now() });
      }

      return resultData as T;
    } finally {
      if (isGet) {
        inFlightFetchMap.delete(`GET:${endpoint}`);
      }
    }
  })();

  if (isGet) {
    inFlightFetchMap.set(`GET:${endpoint}`, fetchPromise);
  }

  return fetchPromise;
}
