import { useCallback, useEffect, useState } from 'react';
import { ownerApi } from '../api/client';
import { Alert, SortHeader } from '../components/ui';
import { formatRating } from '../utils/validation';

export default function OwnerDashboard() {
  const [data, setData] = useState({ stores: [], averageRating: null, raters: [] });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await ownerApi.dashboard({ sortBy, sortOrder });
    setData(result);
  }, [sortBy, sortOrder]);

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [load]);

  function toggleSort(field) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Store owner dashboard</h1>
          <p>See who rated your store and track your average score.</p>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat">
          <span>Average store rating</span>
          <strong>{formatRating(data.averageRating)}</strong>
        </div>
        <div className="stat">
          <span>Stores linked</span>
          <strong>{data.stores?.length || 0}</strong>
        </div>
      </div>

      {data.stores?.length ? (
        <section className="panel">
          <div className="panel-header">
            <h2>Your stores</h2>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {data.stores.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="panel">
          <div className="empty">No store is linked to this owner account yet. Ask an admin to assign one.</div>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Users who rated your store</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <SortHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                <SortHeader label="Email" field="email" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                <SortHeader label="Rating" field="rating" sortBy={sortBy} sortOrder={sortOrder} onSort={toggleSort} />
                <th>Store</th>
              </tr>
            </thead>
            <tbody>
              {(data.raters || []).map((r) => (
                <tr key={`${r.id}-${r.storeId}-${r.updated_at}`}>
                  <td>{r.name}</td>
                  <td>{r.email}</td>
                  <td>{r.rating}</td>
                  <td>{r.storeName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.raters?.length ? <div className="empty">No ratings submitted yet.</div> : null}
        </div>
      </section>
    </div>
  );
}
