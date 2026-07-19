const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { parseListQuery, buildLikeFilters } = require('../utils/queryHelpers');

async function dashboard(req, res) {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[stores]] = await pool.query('SELECT COUNT(*) AS totalStores FROM stores');
    const [[ratings]] = await pool.query('SELECT COUNT(*) AS totalRatings FROM ratings');

    return res.json({
      totalUsers: users.totalUsers,
      totalStores: stores.totalStores,
      totalRatings: ratings.totalRatings,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, address, password, role = 'USER' } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, address, role]
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: { id: result.insertId, name, email, address, role },
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ message: 'Server error creating user' });
  }
}

async function listUsers(req, res) {
  try {
    const filters = parseListQuery(req.query, ['name', 'email', 'address', 'role', 'created_at']);
    const { conditions, params } = buildLikeFilters(filters, ['name', 'email', 'address']);

    if (filters.role && ['ADMIN', 'USER', 'STORE_OWNER'].includes(filters.role)) {
      conditions.push('role = :role');
      params.role = filters.role;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = {
      name: 'name',
      email: 'email',
      address: 'address',
      role: 'role',
      created_at: 'created_at',
    }[filters.sortBy] || 'name';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT id, name, email, address, role, created_at
       FROM users ${where}
       ORDER BY ${sortCol} ${filters.sortOrder}
       LIMIT ${filters.limit} OFFSET ${filters.offset}`,
      params
    );

    // Attach store owner average rating when role is STORE_OWNER
    const users = await Promise.all(
      rows.map(async (user) => {
        if (user.role !== 'STORE_OWNER') return user;
        const [ratingRows] = await pool.execute(
          `SELECT ROUND(AVG(r.rating), 2) AS avgRating
           FROM stores s
           LEFT JOIN ratings r ON r.store_id = s.id
           WHERE s.owner_id = ?`,
          [user.id]
        );
        return { ...user, rating: ratingRows[0]?.avgRating ?? null };
      })
    );

    return res.json({
      data: users,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / filters.limit) || 1,
      },
    });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ message: 'Server error listing users' });
  }
}

async function getUser(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, address, role, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });

    const user = rows[0];
    if (user.role === 'STORE_OWNER') {
      const [ratingRows] = await pool.execute(
        `SELECT ROUND(AVG(r.rating), 2) AS avgRating
         FROM stores s
         LEFT JOIN ratings r ON r.store_id = s.id
         WHERE s.owner_id = ?`,
        [user.id]
      );
      user.rating = ratingRows[0]?.avgRating ?? null;
    }

    return res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createStore(req, res) {
  try {
    const { name, email, address, owner_id } = req.body;

    const [existing] = await pool.execute('SELECT id FROM stores WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Store email already registered' });
    }

    let ownerId = owner_id || null;
    if (ownerId) {
      const [owners] = await pool.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [ownerId]
      );
      if (!owners.length) {
        return res.status(400).json({ message: 'Owner user not found' });
      }
      if (owners[0].role !== 'STORE_OWNER') {
        return res.status(400).json({ message: 'Assigned user must have STORE_OWNER role' });
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name, email, address, ownerId]
    );

    return res.status(201).json({
      message: 'Store created successfully',
      store: { id: result.insertId, name, email, address, owner_id: ownerId },
    });
  } catch (err) {
    console.error('Create store error:', err);
    return res.status(500).json({ message: 'Server error creating store' });
  }
}

async function listStores(req, res) {
  try {
    const filters = parseListQuery(req.query, ['name', 'email', 'address', 'rating', 'created_at']);
    const conditions = [];
    const params = {};

    if (filters.name) {
      conditions.push('s.name LIKE :name');
      params.name = `%${filters.name}%`;
    }
    if (filters.email) {
      conditions.push('s.email LIKE :email');
      params.email = `%${filters.email}%`;
    }
    if (filters.address) {
      conditions.push('s.address LIKE :address');
      params.address = `%${filters.address}%`;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'avgRating',
      created_at: 's.created_at',
    }[filters.sortBy] || 's.name';

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM stores s ${where}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at,
              ROUND(AVG(r.rating), 2) AS rating
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
        ...row,
        rating: row.rating !== null ? Number(row.rating) : null,
      })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / filters.limit) || 1,
      },
    });
  } catch (err) {
    console.error('Admin list stores error:', err);
    return res.status(500).json({ message: 'Server error listing stores' });
  }
}

module.exports = {
  dashboard,
  createUser,
  listUsers,
  getUser,
  createStore,
  listStores,
};
