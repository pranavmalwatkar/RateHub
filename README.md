# RateHub — Store Ratings Platform

Full-stack web app for rating registered stores (1–5), with role-based access for **System Administrator**, **Normal User**, and **Store Owner**.

## Tech stack

- **Backend:** Express.js, MySQL, JWT, bcrypt
- **Frontend:** React (Vite), React Router

## Prerequisites

- Node.js 18+
- MySQL 8+

## Setup

### 1. Database

Create/configure MySQL, then update `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=store_ratings
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
```

Apply schema + seed demo data:

```bash
cd backend
npm install
npm run seed
```

Or run `backend/sql/schema.sql` manually in MySQL, then `npm run seed`.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to the backend)

## Demo accounts (after seed)

| Role        | Email                     | Password   |
|-------------|---------------------------|------------|
| Admin       | admin@storeratings.com    | Admin@123  |
| Normal User | user@storeratings.com     | User@1234  |
| Store Owner | owner@storeratings.com   | Owner@123  |

## Features

### System Administrator
- Dashboard totals (users, stores, ratings)
- Add users (USER / ADMIN / STORE_OWNER) and stores
- Filterable, sortable user & store lists
- User detail view (includes owner rating when applicable)
- Logout

### Normal User
- Signup & login
- Browse/search stores, submit/modify ratings (1–5)
- Update password, logout

### Store Owner
- Login, update password
- Dashboard: average rating + users who rated their store
- Logout

## Form validation

- **Name:** 20–60 characters  
- **Address:** max 400 characters  
- **Password:** 8–16 chars, ≥1 uppercase, ≥1 special character  
- **Email:** standard email format  

## API overview

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |
| PUT | `/api/auth/password` | Auth |
| GET | `/api/admin/dashboard` | Admin |
| GET/POST | `/api/admin/users` | Admin |
| GET | `/api/admin/users/:id` | Admin |
| GET/POST | `/api/admin/stores` | Admin |
| GET | `/api/stores` | User / Admin |
| POST/PUT | `/api/stores/:storeId/ratings` | User / Admin |
| GET | `/api/owner/dashboard` | Store Owner |

## Project structure

```
backend/          Express API + MySQL
frontend/         React SPA
```
