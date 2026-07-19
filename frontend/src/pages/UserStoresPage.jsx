import { useCallback, useEffect, useState } from 'react';
import { storeApi } from '../api/client';
import { Alert, Field, Pagination, RatingStars, SortHeader } from '../components/ui';
import { formatRating } from '../utils/validation';

export default function UserStoresPage() {
  const [stores, setStores] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    address: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState({});

  const loadStores = useCallback(async () => {
    const data = await storeApi.list(filters);
    setStores(data.data);
    setPagination(data.pagination);
  }, [filters]);

  useEffect(() => {
    loadStores().catch((err) => setError(err.message));
  }, [loadStores]);

  function toggleSort(field) {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  }

  async function handleRate(storeId, rating) {
    setPending((p) => ({ ...p, [storeId]: true }));
    setError('');
    setSuccess('');
    try {
      const result = await storeApi.rate(storeId, rating);
      setSuccess(result.message);
      await loadStores();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending((p) => ({ ...p, [storeId]: false }));
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Browse stores</h1>
          <p>Search stores, view overall ratings, and submit or update your score.</p>
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{success}</Alert>

      <section className="panel">
        <div className="filters compact">
          <Field label="Search by name">
            <input
              value={filters.name}
              onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value, page: 1 }))}
              placeholder="Store name"
            />
          </Field>
          <Field label="Search by address">
            <input
              value={filters.address}
              onChange={(e) => setFilters((p) => ({ ...p, address: e.target.value, page: 1 }))}
              placeholder="Address"
            />
          </Field>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFilters({ name: '', address: '', sortBy: 'name', sortOrder: 'asc', page: 1 })}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="table-wrap" style={{ marginBottom: '1rem' }}>
          <table>
            <thead>
              <tr>
                <SortHeader label="Store name" field="name" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} />
                <SortHeader label="Address" field="address" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} />
                <SortHeader label="Overall" field="rating" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={toggleSort} />
                <th>Your rating</th>
                <th>Rate / modify</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td>{store.name}</td>
                  <td>{store.address}</td>
                  <td>{formatRating(store.overallRating)}</td>
                  <td>{store.userRating ?? 'Not rated'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <RatingStars
                        value={store.userRating || 0}
                        onChange={(rating) => handleRate(store.id, rating)}
                      />
                      {pending[store.id] ? <span className="muted">Saving…</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stores.length ? <div className="empty">No stores found.</div> : null}
        </div>

        <Pagination
          pagination={pagination}
          onPageChange={(page) => setFilters((p) => ({ ...p, page }))}
        />
      </section>
    </div>
  );
}
