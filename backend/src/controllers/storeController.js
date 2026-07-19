const pool = require('../config/db');
const { parseListQuery } = require('../utils/queryHelpers');

async function listStores(req, res) {
  try {
    const filters = parseListQuery(req.query, ['name', 'address', 'rating', 'created_at']);
    const conditions = [];
    const params = { userId: req.user.id };

    if (filters.name) {
      conditions.push('s.name LIKE :name');
      params.name = `%${filters.name}%`;
    }
    if (filters.address) {
      conditions.push('s.address LIKE :address');
      params.address = `%${filters.address}%`;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = {
      name: 's.name',
      address: 's.address',
      rating: 'overallRating',
      created_at: 's.created_at',
    }[filters.sortBy] || 's.name';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM stores s ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.address,
              ROUND(AVG(r.rating), 2) AS overallRating,
              (
                SELECT ur.rating FROM ratings ur
                WHERE ur.store_id = s.id AND ur.user_id = :userId
                LIMIT 1
              ) AS userRating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY ${sortCol} ${filters.sortOrder}
       LIMIT ${filters.limit} OFFSET ${filters.offset}`,
      params
    );

    return res.json({
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        overallRating: row.overallRating !== null ? Number(row.overallRating) : null,
        userRating: row.userRating !== null ? Number(row.userRating) : null,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / filters.limit) || 1,
      },
    });
  } catch (err) {
    console.error('List stores error:', err);
    return res.status(500).json({ message: 'Server error listing stores' });
  }
}

async function submitOrUpdateRating(req, res) {
  try {
    const storeId = Number(req.params.storeId);
    const { rating } = req.body;
    const userId = req.user.id;

    const [stores] = await pool.execute('SELECT id FROM stores WHERE id = ?', [storeId]);
    if (!stores.length) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const [existing] = await pool.execute(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (existing.length) {
      await pool.execute(
        'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
        [rating, userId, storeId]
      );
      return res.json({ message: 'Rating updated successfully', rating });
    }

    await pool.execute(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
      [userId, storeId, rating]
    );
    return res.status(201).json({ message: 'Rating submitted successfully', rating });
  } catch (err) {
    console.error('Submit rating error:', err);
    return res.status(500).json({ message: 'Server error submitting rating' });
  }
}

module.exports = { listStores, submitOrUpdateRating };
