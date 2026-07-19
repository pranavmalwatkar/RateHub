import { useEffect, useMemo, useState } from 'react';

const API_BASE = '/api';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function App() {
  const [authView, setAuthView] = useState('login');
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [form, setForm] = useState({ email: '', password: '', name: '', address: '' });
  const [stores, setStores] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [adminStores, setAdminStores] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [storeOwnerDashboard, setStoreOwnerDashboard] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'system_admin';
  const isOwner = user?.role === 'store_owner';
  const isNormal = user?.role === 'normal_user';

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const request = async (url, options = {}, parseJson = true) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    const data = parseJson ? await response.json() : await response.text();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await request(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setMessage('Logged in successfully');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await request(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          address: form.address,
          password: form.password,
        }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setMessage('Registration successful');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setStores([]);
    setDashboard(null);
    setAdminStores([]);
    setAdminUsers([]);
    setStoreOwnerDashboard(null);
    setMessage('You have been logged out');
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await request(`${API_BASE}/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.password, newPassword: form.password }),
      });
      setMessage('Password updated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const data = await request(`${API_BASE}/stores?search=${encodeURIComponent(search)}`);
      setStores(data.stores || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchAdminDashboard = async () => {
    try {
      const data = await request(`${API_BASE}/admin/dashboard`);
      setDashboard(data.totals);
      const storeData = await request(`${API_BASE}/admin/stores`);
      setAdminStores(storeData.stores || []);
      const usersData = await request(`${API_BASE}/admin/users`);
      setAdminUsers(usersData.users || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const fetchOwnerDashboard = async () => {
    try {
      const data = await request(`${API_BASE}/store-owner/dashboard`);
      setStoreOwnerDashboard(data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    if (user && token) {
      if (isNormal) fetchStores();
      if (isAdmin) fetchAdminDashboard();
      if (isOwner) fetchOwnerDashboard();
    }
  }, [user, token, search]);

  const submitRating = async (storeId, value) => {
    try {
      const data = await request(`${API_BASE}/stores/${storeId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      setStores((prev) => prev.map((store) => (store.id === storeId ? data.store : store)));
      setMessage('Rating submitted');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const renderAuth = () => {
    if (!user) {
      return (
        <div className="auth-card">
          <h2>{authView === 'login' ? 'Login' : 'Register'}</h2>
          {message ? <p className="message">{message}</p> : null}
          <form onSubmit={authView === 'login' ? login : register}>
            {authView === 'register' ? (
              <>
                <input name="name" placeholder="Name (20-60 chars)" value={form.name} onChange={handleChange} required />
                <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
              </>
            ) : null}
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="submit" disabled={loading}>{loading ? 'Please wait...' : authView === 'login' ? 'Sign in' : 'Create account'}</button>
          </form>
          <p>
            {authView === 'login' ? 'New user?' : 'Already registered?'}{' '}
            <button className="text-button" onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}>
              {authView === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Store Rating Platform</h1>
        {user ? <button onClick={logout}>Logout</button> : null}
      </header>
      {renderAuth()}
      {user ? (
        <div className="content">
          <div className="card">
            <h2>Welcome, {user.name}</h2>
            <p>Role: {user.roleLabel}</p>
            <form onSubmit={updatePassword}>
              <input name="password" type="password" placeholder="New password" value={form.password} onChange={handleChange} required />
              <button type="submit" disabled={loading}>Update Password</button>
            </form>
            {message ? <p className="message">{message}</p> : null}
          </div>

          {isNormal ? (
            <div className="card">
              <h3>Registered Stores</h3>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or address" />
              <div className="list">
                {stores.map((store) => (
                  <div key={store.id} className="list-item">
                    <div>
                      <strong>{store.name}</strong>
                      <p>{store.address}</p>
                      <p>Average Rating: {store.averageRating}</p>
                      <p>Your Rating: {store.submittedRating ?? 'Not submitted'}</p>
                    </div>
                    <div className="actions">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button key={value} onClick={() => submitRating(store.id, value)}>{value}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="card">
              <h3>Admin Dashboard</h3>
              {dashboard ? (
                <div className="grid">
                  <div>Users: {dashboard.users}</div>
                  <div>Stores: {dashboard.stores}</div>
                  <div>Ratings: {dashboard.ratings}</div>
                </div>
              ) : null}
              <h4>Stores</h4>
              <ul>{adminStores.map((store) => <li key={store.id}>{store.name} - {store.address} - {store.rating}</li>)}</ul>
              <h4>Users</h4>
              <ul>{adminUsers.map((entry) => <li key={entry.id}>{entry.name} ({entry.roleLabel}) - {entry.email} - {entry.address}</li>)}</ul>
            </div>
          ) : null}

          {isOwner ? (
            <div className="card">
              <h3>Store Owner Dashboard</h3>
              {storeOwnerDashboard ? (
                <>
                  <p>Store: {storeOwnerDashboard.store.name}</p>
                  <p>Average Rating: {storeOwnerDashboard.store.averageRating}</p>
                  <ul>{storeOwnerDashboard.ratings.map((entry) => <li key={entry.userId}>{entry.userName}: {entry.rating}</li>)}</ul>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default App;
