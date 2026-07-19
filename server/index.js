import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'challenge-secret';

app.use(cors());
app.use(express.json());

const roleLabels = {
  system_admin: 'System Administrator',
  normal_user: 'Normal User',
  store_owner: 'Store Owner',
};

function validateUserPayload(payload) {
  const errors = [];
  if (!payload.name || payload.name.trim().length < 20 || payload.name.trim().length > 60) {
    errors.push('Name must be between 20 and 60 characters');
  }
  if (!payload.address || payload.address.trim().length > 400) {
    errors.push('Address must be 400 characters or fewer');
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!payload.email || !emailRegex.test(payload.email)) {
    errors.push('A valid email is required');
  }
  const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
  if (!payload.password || !passwordRegex.test(payload.password)) {
    errors.push('Password must be 8-16 characters with one uppercase letter and one special character');
  }
  return errors;
}

const storedUsers = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@store.com',
    address: '100 Admin Avenue',
    passwordHash: bcrypt.hashSync('Admin@123', 8),
    role: 'system_admin',
  },
  {
    id: 2,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    address: '12 Orchard Road',
    passwordHash: bcrypt.hashSync('Password@1', 8),
    role: 'normal_user',
  },
  {
    id: 3,
    name: 'Brian Turner',
    email: 'owner@example.com',
    address: '9 Market Street',
    passwordHash: bcrypt.hashSync('Owner@123', 8),
    role: 'store_owner',
  },
];

const stores = [
  {
    id: 1,
    name: 'Green Mart',
    ownerId: 3,
    ownerEmail: 'owner@example.com',
    address: '10 Elm Street',
    ratings: [
      { userId: 2, value: 4 },
    ],
  },
  {
    id: 2,
    name: 'North Plaza',
    ownerId: 3,
    ownerEmail: 'owner@example.com',
    address: '20 Cedar Avenue',
    ratings: [
      { userId: 2, value: 5 },
    ],
  },
  {
    id: 3,
    name: 'Sunrise Pantry',
    ownerId: 3,
    ownerEmail: 'owner@example.com',
    address: '88 River Lane',
    ratings: [],
  },
];

const db = {
  async connect() {
    try {
      return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'store_rating_app',
      });
    } catch (error) {
      return null;
    }
  },
};

function getAverageRating(store) {
  if (!store.ratings.length) return 0;
  const total = store.ratings.reduce((sum, entry) => sum + entry.value, 0);
  return Number((total / store.ratings.length).toFixed(1));
}

function serializeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
    roleLabel: roleLabels[user.role],
  };
}

function serializeStore(store, currentUserId) {
  const submittedRating = store.ratings.find((entry) => entry.userId === currentUserId)?.value || null;
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    ownerEmail: store.ownerEmail,
    averageRating: getAverageRating(store),
    submittedRating,
    ratingCount: store.ratings.length,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = storedUsers.find((entry) => entry.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: serializeUser(user) });
});

app.post('/api/auth/register', async (req, res) => {
  const validationErrors = validateUserPayload(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ message: validationErrors[0] });
  }
  const exists = storedUsers.some((entry) => entry.email.toLowerCase() === req.body.email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const user = {
    id: storedUsers.length + 1,
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    address: req.body.address.trim(),
    passwordHash: bcrypt.hashSync(req.body.password, 8),
    role: 'normal_user',
  };
  storedUsers.push(user);
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
  res.status(201).json({ token, user: serializeUser(user) });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = storedUsers.find((entry) => entry.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: serializeUser(user) });
});

app.get('/api/stores', authMiddleware, (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  const filtered = stores.filter((store) => {
    const haystack = `${store.name} ${store.address}`.toLowerCase();
    return haystack.includes(search);
  });
  const userId = req.user.id;
  res.json({ stores: filtered.map((store) => serializeStore(store, userId)) });
});

app.post('/api/stores/:storeId/rate', authMiddleware, (req, res) => {
  const value = Number(req.body.value);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }
  const store = stores.find((entry) => entry.id === Number(req.params.storeId));
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }
  const user = storedUsers.find((entry) => entry.id === req.user.id);
  if (!user || user.role !== 'normal_user') {
    return res.status(403).json({ message: 'Only normal users can submit ratings' });
  }
  const existing = store.ratings.find((entry) => entry.userId === req.user.id);
  if (existing) {
    existing.value = value;
  } else {
    store.ratings.push({ userId: req.user.id, value });
  }
  res.json({ store: serializeStore(store, req.user.id) });
});

app.patch('/api/users/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;
  if (!passwordRegex.test(newPassword || '')) {
    return res.status(400).json({ message: 'Password must be 8-16 characters with one uppercase letter and one special character' });
  }
  const user = storedUsers.find((entry) => entry.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const valid = await bcrypt.compare(currentPassword || '', user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  user.passwordHash = bcrypt.hashSync(newPassword, 8);
  res.json({ message: 'Password updated' });
});

app.get('/api/admin/dashboard', authMiddleware, (_req, res) => {
  const user = storedUsers.find((entry) => entry.id === _req.user.id);
  if (!user || user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const totalRatings = stores.reduce((sum, store) => sum + store.ratings.length, 0);
  res.json({
    totals: {
      users: storedUsers.length,
      stores: stores.length,
      ratings: totalRatings,
    },
  });
});

app.get('/api/admin/stores', authMiddleware, (_req, res) => {
  const user = storedUsers.find((entry) => entry.id === _req.user.id);
  if (!user || user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ stores: stores.map((store) => ({
    id: store.id,
    name: store.name,
    email: store.ownerEmail,
    address: store.address,
    rating: getAverageRating(store),
  })) });
});

app.get('/api/admin/users', authMiddleware, (_req, res) => {
  const user = storedUsers.find((entry) => entry.id === _req.user.id);
  if (!user || user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const list = storedUsers.map((entry) => {
    const store = stores.find((item) => item.ownerId === entry.id);
    return {
      id: entry.id,
      name: entry.name,
      email: entry.email,
      address: entry.address,
      role: entry.role,
      roleLabel: roleLabels[entry.role],
      rating: entry.role === 'store_owner' && store ? getAverageRating(store) : undefined,
    };
  });
  res.json({ users: list });
});

app.post('/api/admin/users', authMiddleware, async (req, res) => {
  const user = storedUsers.find((entry) => entry.id === req.user.id);
  if (!user || user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const validationErrors = validateUserPayload(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ message: validationErrors[0] });
  }
  const exists = storedUsers.some((entry) => entry.email.toLowerCase() === req.body.email.toLowerCase());
  if (exists) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const created = {
    id: storedUsers.length + 1,
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    address: req.body.address.trim(),
    passwordHash: bcrypt.hashSync(req.body.password, 8),
    role: req.body.role || 'normal_user',
  };
  storedUsers.push(created);
  res.status(201).json({ user: serializeUser(created) });
});

app.post('/api/admin/stores', authMiddleware, (req, res) => {
  const user = storedUsers.find((entry) => entry.id === req.user.id);
  if (!user || user.role !== 'system_admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const store = {
    id: stores.length + 1,
    name: req.body.name.trim(),
    ownerId: Number(req.body.ownerId) || 3,
    ownerEmail: req.body.ownerEmail || 'owner@example.com',
    address: req.body.address.trim(),
    ratings: [],
  };
  stores.push(store);
  res.status(201).json({ store });
});

app.get('/api/store-owner/dashboard', authMiddleware, (_req, res) => {
  const user = storedUsers.find((entry) => entry.id === _req.user.id);
  if (!user || user.role !== 'store_owner') {
    return res.status(403).json({ message: 'Access denied' });
  }
  const store = stores.find((entry) => entry.ownerId === user.id);
  if (!store) {
    return res.status(404).json({ message: 'No store found' });
  }
  const ratings = store.ratings.map((entry) => {
    const reviewer = storedUsers.find((item) => item.id === entry.userId);
    return {
      userId: entry.userId,
      userName: reviewer?.name || 'Unknown',
      rating: entry.value,
    };
  });
  res.json({ store: { id: store.id, name: store.name, address: store.address, averageRating: getAverageRating(store) }, ratings });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
