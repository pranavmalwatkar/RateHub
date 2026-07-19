export function Alert({ type = 'error', children }) {
  if (!children) return null;
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function SortHeader({ label, field, sortBy, sortOrder, onSort }) {
  const active = sortBy === field;
  return (
    <th>
      <button type="button" onClick={() => onSort(field)}>
        {label}
        {active ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );
}

export function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span>
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function RatingStars({ value, onChange, readOnly = false }) {
  const current = Number(value) || 0;
  return (
    <div className="rating-stars" role={readOnly ? 'img' : 'group'} aria-label={`Rating ${current} of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= current ? 'on' : ''}
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function RoleBadge({ role }) {
  const cls = role === 'ADMIN' ? 'admin' : role === 'STORE_OWNER' ? 'owner' : '';
  return <span className={`badge ${cls}`}>{role.replace('_', ' ')}</span>;
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="panel-header">
          <h3>{title}</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="error">{error}</span> : null}
    </div>
  );
}
