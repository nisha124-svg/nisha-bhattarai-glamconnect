const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

const trimTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
);

export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')
);
