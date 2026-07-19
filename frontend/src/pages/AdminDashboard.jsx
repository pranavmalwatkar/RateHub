import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/client';
import {
  Alert,
  Field,
  Modal,
  Pagination,
  RoleBadge,
  SortHeader,
} from '../components/ui';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword,
  formatRating,
} from '../utils/validation';

const emptyUser = {
  name: '',
  email: '',
  address: '',
  password: '',
  role: 'USER',
};

const emptyStore = {
  name: '',
  email: '',
  address: '',
  owner_id: '',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  const [tab, setTab] = useState('users');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [userFilters, setUserFilters] = useState({
    name: '',
    email: '',
    address: '',
    role: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
  });

  const [stores, setStores] = useState([]);
  const [storePagination, setStorePagination] = useState(null);
  const [storeFilters, setStoreFilters] = useState({
    name: '',
    email: '',
    address: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
  });

  const [showUserModal, setShowUserModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [userForm, setUserForm] = useState(emptyUser);
  const [storeForm, setStoreForm] = useState(emptyStore);
  const [formErrors, setFormErrors] = useState({});
  const [detailUser, setDetailUser] = useState(null);
  const [ownerOptions, setOwnerOptions] = useState([]);

  const loadStats = useCallback(async () => {
    const data = await adminApi.dashboard();
    setStats(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await adminApi.users(userFilters);
    setUsers(data.data);
    setUserPagination(data.pagination);
  }, [userFilters]);

  const loadStores = useCallback(async () => {
    const data = await adminApi.stores(storeFilters);
    setStores(data.data);
    setStorePagination(data.pagination);
  }, [storeFilters]);

  useEffect(() => {
    loadStats().catch((err) => setError(err.message));
  }, [loadStats]);

  useEffect(() => {
    if (tab === 'users') {
      loadUsers().catch((err) => setError(err.message));
    } else {
      loadStores().catch((err) => setError(err.message));
    }
  }, [tab, loadUsers, loadStores]);

  async function openStoreModal() {
    setStoreForm(emptyStore);
    setFormErrors({});
    try {
      const data = await adminApi.users({ role: 'STORE_OWNER', limit: 100, sortBy: 'name' });
      setOwnerOptions(data.data);
    } catch {
      setOwnerOptions([]);
    }
    setShowStoreModal(true);
  }

  function toggleUserSort(field) {
    setUserFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  function toggleStoreSort(field) {
    setStoreFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  async function submitUser(e) {
    e.preventDefault();
    const next = {
      name: validateName(userForm.name),
      email: validateEmail(userForm.email),
      address: validateAddress(userForm.address),
      password: validatePassword(userForm.password),
    };
    setFormErrors(next);
    if (Object.values(next).some(Boolean)) return;

    try {
      await adminApi.createUser(userForm);
      setShowUserModal(false);
      setUserForm(emptyUser);
      setSuccess('User created successfully');
      setError('');
      await Promise.all([loadUsers(), loadStats()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitStore(e) {
    e.preventDefault();
    const next = {
      name: validateName(storeForm.name),
      email: validateEmail(storeForm.email),
      address: validateAddress(storeForm.address),
    };
    setFormErrors(next);
    if (Object.values(next).some(Boolean)) return;

    try {
      const payload = {
        ...storeForm,
        owner_id: storeForm.owner_id ? Number(storeForm.owner_id) : undefined,
      };
      await adminApi.createStore(payload);
      setShowStoreModal(false);
      setStoreForm(emptyStore);
      setSuccess('Store created successfully');
      setError('');
      setTab('stores');
      await Promise.all([loadStores(), loadStats()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function viewUser(id) {
    try {
      const data = await adminApi.user(id);
      setDetailUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Admin dashboard</h1>
          <p>Monitor platform activity and manage users and stores.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={() => { setUserForm(emptyUser); setFormErrors({}); setShowUserModal(true); }}>
            Add user
          </button>
          <button type="button" className="btn btn-primary" onClick={openStoreModal}>
            Add store
          </button>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="grid-stats">
        <div className="stat">
          <span>Total users</span>
          <strong>{stats.totalUsers}</strong>
        </div>
        <div className="stat">
          <span>Total stores</span>
          <strong>{stats.totalStores}</strong>
        </div>
        <div className="stat">
          <span>Total ratings</span>
          <strong>{stats.totalRatings}</strong>
        </div>
      </div>

      <div className="tabs">
        <button type="button" className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users
        </button>
        <button type="button" className={`tab ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}>
          Stores
        </button>
      </div>

      {tab === 'users' ? (
        <section className="panel">
          <div className="filters">
            <Field label="Name">
              <input
                value={userFilters.name}
                onChange={(e) => setUserFilters((p) => ({ ...p, name: e.target.value, page: 1 }))}
                placeholder="Filter by name"
              />
            </Field>
            <Field label="Email">
              <input
                value={userFilters.email}
                onChange={(e) => setUserFilters((p) => ({ ...p, email: e.target.value, page: 1 }))}
                placeholder="Filter by email"
              />
            </Field>
            <Field label="Address">
              <input
                value={userFilters.address}
                onChange={(e) => setUserFilters((p) => ({ ...p, address: e.target.value, page: 1 }))}
                placeholder="Filter by address"
              />
            </Field>
            <Field label="Role">
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters((p) => ({ ...p, role: e.target.value, page: 1 }))}
              >
                <option value="">All roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
                <option value="STORE_OWNER">STORE_OWNER</option>
              </select>
            </Field>
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setUserFilters({ name: '', email: '', address: '', role: '', sortBy: 'name', sortOrder: 'asc', page: 1 })}>
                Reset
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortHeader label="Name" field="name" sortBy={userFilters.sortBy} sortOrder={userFilters.sortOrder} onSort={toggleUserSort} />
                  <SortHeader label="Email" field="email" sortBy={userFilters.sortBy} sortOrder={userFilters.sortOrder} onSort={toggleUserSort} />
                  <SortHeader label="Address" field="address" sortBy={userFilters.sortBy} sortOrder={userFilters.sortOrder} onSort={toggleUserSort} />
                  <SortHeader label="Role" field="role" sortBy={userFilters.sortBy} sortOrder={userFilters.sortOrder} onSort={toggleUserSort} />
                  <th>Rating</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.address}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.role === 'STORE_OWNER' ? formatRating(u.rating) : '—'}</td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => viewUser(u.id)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length ? <div className="empty">No users match your filters.</div> : null}
          </div>
          <Pagination
            pagination={userPagination}
            onPageChange={(page) => setUserFilters((p) => ({ ...p, page }))}
          />
        </section>
      ) : (
        <section className="panel">
          <div className="filters">
            <Field label="Name">
              <input
                value={storeFilters.name}
                onChange={(e) => setStoreFilters((p) => ({ ...p, name: e.target.value, page: 1 }))}
                placeholder="Filter by name"
              />
            </Field>
            <Field label="Email">
              <input
                value={storeFilters.email}
                onChange={(e) => setStoreFilters((p) => ({ ...p, email: e.target.value, page: 1 }))}
                placeholder="Filter by email"
              />
            </Field>
            <Field label="Address">
              <input
                value={storeFilters.address}
                onChange={(e) => setStoreFilters((p) => ({ ...p, address: e.target.value, page: 1 }))}
                placeholder="Filter by address"
              />
            </Field>
            <div />
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStoreFilters({ name: '', email: '', address: '', sortBy: 'name', sortOrder: 'asc', page: 1 })}>
                Reset
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortHeader label="Name" field="name" sortBy={storeFilters.sortBy} sortOrder={storeFilters.sortOrder} onSort={toggleStoreSort} />
                  <SortHeader label="Email" field="email" sortBy={storeFilters.sortBy} sortOrder={storeFilters.sortOrder} onSort={toggleStoreSort} />
                  <SortHeader label="Address" field="address" sortBy={storeFilters.sortBy} sortOrder={storeFilters.sortOrder} onSort={toggleStoreSort} />
                  <SortHeader label="Rating" field="rating" sortBy={storeFilters.sortBy} sortOrder={storeFilters.sortOrder} onSort={toggleStoreSort} />
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.address}</td>
                    <td>{formatRating(s.rating)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!stores.length ? <div className="empty">No stores match your filters.</div> : null}
          </div>
          <Pagination
            pagination={storePagination}
            onPageChange={(page) => setStoreFilters((p) => ({ ...p, page }))}
          />
        </section>
      )}

      {showUserModal ? (
        <Modal title="Add user" onClose={() => setShowUserModal(false)}>
          <form onSubmit={submitUser} className="form-grid">
            <Field label="Name" error={formErrors.name}>
              <input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Email" error={formErrors.email}>
              <input value={userForm.email} onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Role">
              <select value={userForm.role} onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STORE_OWNER">STORE_OWNER</option>
              </select>
            </Field>
            <Field label="Password" error={formErrors.password}>
              <input type="password" value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} />
            </Field>
            <div className="full">
              <Field label="Address" error={formErrors.address}>
                <textarea value={userForm.address} onChange={(e) => setUserForm((p) => ({ ...p, address: e.target.value }))} />
              </Field>
            </div>
            <div className="full modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create user</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showStoreModal ? (
        <Modal title="Add store" onClose={() => setShowStoreModal(false)}>
          <form onSubmit={submitStore} className="form-grid">
            <Field label="Store name" error={formErrors.name}>
              <input value={storeForm.name} onChange={(e) => setStoreForm((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Email" error={formErrors.email}>
              <input value={storeForm.email} onChange={(e) => setStoreForm((p) => ({ ...p, email: e.target.value }))} />
            </Field>
            <div className="full">
              <Field label="Address" error={formErrors.address}>
                <textarea value={storeForm.address} onChange={(e) => setStoreForm((p) => ({ ...p, address: e.target.value }))} />
              </Field>
            </div>
            <div className="full">
              <Field label="Owner (optional)">
                <select value={storeForm.owner_id} onChange={(e) => setStoreForm((p) => ({ ...p, owner_id: e.target.value }))}>
                  <option value="">No owner assigned</option>
                  {ownerOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="full modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowStoreModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create store</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {detailUser ? (
        <Modal title="User details" onClose={() => setDetailUser(null)}>
          <div className="auth-stack">
            <p><strong>Name:</strong> {detailUser.name}</p>
            <p><strong>Email:</strong> {detailUser.email}</p>
            <p><strong>Address:</strong> {detailUser.address}</p>
            <p><strong>Role:</strong> <RoleBadge role={detailUser.role} /></p>
            {detailUser.role === 'STORE_OWNER' ? (
              <p><strong>Store rating:</strong> {formatRating(detailUser.rating)}</p>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
