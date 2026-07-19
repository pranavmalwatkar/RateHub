const pool = require('../config/db');
const { parseListQuery } = require('../utils/queryHelpers');

async function dashboard(req, res) {
  try {
    const [stores] = await pool.execute(
      'SELECT id, name FROM stores WHERE owner_id = ?',
      [req.user.id]
    );

    if (!stores.length) {
      return res.json({
        stores: [],
        averageRating: null,
        raters: [],
        message: 'No store linked to this owner account',
      });
    }

    // Support owners with one or more stores; aggregate across owned stores
    const storeIds = stores.map((s) => s.id);
    const placeholders = storeIds.map(() => '?').join(',');

    const [avgRows] = await pool.execute(
      `SELECT ROUND(AVG(rating), 2) AS averageRating
       FROM ratings WHERE store_id IN (${placeholders})`,
      storeIds
    );

    const filters = parseListQuery(req.query, ['name', 'email', 'rating', 'created_at']);
    const sortCol = {
      name: 'u.name',
      email: 'u.email',
      rating: 'r.rating',
      created_at: 'r.created_at',
    }[filters.sortBy] || 'u.name';

    const [raters] = await pool.execute(
      `SELECT u.id, u.name, u.email, r.rating, r.updated_at, s.name AS storeName, s.id AS storeId
       FROM ratings r
       JOIN users u ON u.id = r.user_id
       JOIN stores s ON s.id = r.store_id
       WHERE r.store_id IN (${placeholders})
       ORDER BY ${sortCol} ${filters.sortOrder}`,
      storeIds
    );

    return res.json({
      stores,
      averageRating: avgRows[0].averageRating !== null ? Number(avgRows[0].averageRating) : null,
      raters,
    });
  } catch (err) {
    console.error('Owner dashboard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { dashboard };
