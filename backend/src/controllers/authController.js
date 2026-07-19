const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    role: user.role,
  };
}

async function signup(req, res) {
  try {
    const { name, email, address, password } = req.body;

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, address, 'USER']
    );

    const user = { id: result.insertId, name, email, address, role: 'USER' };
    const token = signToken(user);

    return res.status(201).json({ message: 'Registration successful', token, user: publicUser(user) });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error during signup' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT id, name, email, password, address, role FROM users WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ message: 'Login successful', token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
}

async function me(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, address, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updatePassword(req, res) {
  try {
    const { password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Update password error:', err);
    return res.status(500).json({ message: 'Server error updating password' });
  }
}

module.exports = { signup, login, me, updatePassword };
