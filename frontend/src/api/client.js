const API_BASE = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const message = data?.message || 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    error.errors = data?.errors || [];
    throw error;
  }

  return data;
}

export const authApi = {
  login: (body) => api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  signup: (body) => api('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/api/auth/me'),
  updatePassword: (password) =>
    api('/api/auth/password', { method: 'PUT', body: JSON.stringify({ password }) }),
};

export const adminApi = {
  dashboard: () => api('/api/admin/dashboard'),
  users: (params) => api(`/api/admin/users?${new URLSearchParams(params)}`),
  user: (id) => api(`/api/admin/users/${id}`),
  createUser: (body) => api('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  stores: (params) => api(`/api/admin/stores?${new URLSearchParams(params)}`),
  createStore: (body) => api('/api/admin/stores', { method: 'POST', body: JSON.stringify(body) }),
};

export const storeApi = {
  list: (params) => api(`/api/stores?${new URLSearchParams(params)}`),
  rate: (storeId, rating) =>
    api(`/api/stores/${storeId}/ratings`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),
};

export const ownerApi = {
  dashboard: (params = {}) => api(`/api/owner/dashboard?${new URLSearchParams(params)}`),
};
