require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await connection.query(schema);
  console.log('Schema applied.');

  await connection.changeUser({ database: process.env.DB_NAME || 'store_ratings' });

  const adminPass = await bcrypt.hash('Admin@123', 10);
  const userPass = await bcrypt.hash('User@1234', 10);
  const ownerPass = await bcrypt.hash('Owner@123', 10);

  await connection.query('DELETE FROM ratings');
  await connection.query('DELETE FROM stores');
  await connection.query('DELETE FROM users');

  const [adminResult] = await connection.execute(
    `INSERT INTO users (name, email, password, address, role)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'System Administrator Account',
      'admin@storeratings.com',
      adminPass,
      '100 Admin Plaza, Central Business District, Metropolis',
      'ADMIN',
    ]
  );

  const [userResult] = await connection.execute(
    `INSERT INTO users (name, email, password, address, role)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'Normal User Demo Account XX',
      'user@storeratings.com',
      userPass,
      '42 Maple Street, Green Park Colony, Springfield City',
      'USER',
    ]
  );

  const [ownerResult] = await connection.execute(
    `INSERT INTO users (name, email, password, address, role)
     VALUES (?, ?, ?, ?, ?)`,
    [
      'Store Owner Demo Account XX',
      'owner@storeratings.com',
      ownerPass,
      '88 Commerce Avenue, Market Square, Riverside District',
      'STORE_OWNER',
    ]
  );

  const [storeResult] = await connection.execute(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES (?, ?, ?, ?)`,
    [
      'Fresh Mart Grocery Superstore',
      'freshmart@stores.com',
      '12 Market Lane, Downtown Shopping Complex, Riverside',
      ownerResult.insertId,
    ]
  );

  await connection.execute(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES (?, ?, ?, ?)`,
    [
      'Tech Haven Electronics Hub',
      'techhaven@stores.com',
      '77 Silicon Boulevard, Innovation Park, Tech City',
      null,
    ]
  );

  await connection.execute(
    `INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)`,
    [userResult.insertId, storeResult.insertId, 4]
  );

  console.log('Seed data inserted.');
  console.log('--- Demo accounts ---');
  console.log('Admin : admin@storeratings.com / Admin@123');
  console.log('User  : user@storeratings.com  / User@1234');
  console.log('Owner : owner@storeratings.com / Owner@123');
  console.log(`Admin user id: ${adminResult.insertId}`);

  await connection.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
