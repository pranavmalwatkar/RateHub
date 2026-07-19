function parseListQuery(query, allowedSort = ['name', 'email', 'address', 'role', 'rating', 'created_at']) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  let sortBy = (query.sortBy || 'name').toLowerCase();
  if (!allowedSort.includes(sortBy)) sortBy = allowedSort[0];

  const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  return {
    page,
    limit,
    offset,
    sortBy,
    sortOrder,
    name: (query.name || '').trim(),
    email: (query.email || '').trim(),
    address: (query.address || '').trim(),
    role: (query.role || '').trim().toUpperCase(),
  };
}

function buildLikeFilters(filters, fields) {
  const conditions = [];
  const params = {};

  for (const field of fields) {
    if (filters[field]) {
      conditions.push(`${field} LIKE :${field}`);
      params[field] = `%${filters[field]}%`;
    }
  }

  return { conditions, params };
}

module.exports = { parseListQuery, buildLikeFilters };
