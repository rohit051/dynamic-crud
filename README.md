# AI Dynamic CRUD Fullstack

Full-stack application with:
- **Backend:** Express + TypeScript + MongoDB (dynamic CRUD, auth, admin role checks)
- **Frontend:** React + Vite + TypeScript (auth flows, dashboard, user management UI)

## Project Structure

```text
ai-dynamic-crud-fullstack/
	backend/
	frontend/
```

## Features

- Authentication: register, login, email verification
- Password flows: forgot password, reset password, resend verification
- Role-based access control for admin-only operations
- Dynamic entity/model generation at runtime
- Generic CRUD endpoints with pagination
- Frontend dashboard and service-layer API integration

## Prerequisites

- Node.js 18+ (or current LTS)
- npm
- MongoDB instance (local or cloud)

## Environment Configuration

Create a `.env` file at project root (or for backend runtime as used in your setup) with values like:

```env
MONGODB_URI=your-mongo-connection-string
JWT_SECRET=some-long-secret
ADMIN_EMAIL=admin@example.com
FRONTEND_URL=http://localhost:5173

# Mailer/SMTP (example keys)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

Frontend optional env (`frontend/.env`):

```env
VITE_API_BASE=http://localhost:5000/api
```

> If `VITE_API_BASE` is omitted, frontend should use its configured default.

## Install Dependencies

From project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run in Development

Use two terminals.

### 1) Start backend

```bash
cd backend
npm run dev
```

### 2) Start frontend

```bash
cd frontend
npm run dev
```

Typical local URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

## Build for Production

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Backend API Overview

### Auth routes (`/api/auth`)

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /verify-email`
- `POST /resend-verification`

### Dynamic CRUD routes (`/api/:entity`)

- `GET /api/:entity` (paginated list)
- `GET /api/:entity/:id`
- `POST /api/:entity`
- `PUT /api/:entity/:id`
- `DELETE /api/:entity/:id`

### Dynamic model generation

- `POST /api/generate`
	- Body: `{ entityName: string, fields: Record<string, string> }`

## Notes

- JWT tokens are issued on login.
- User/admin authorization is enforced via middleware.
- Email verification/reset depends on valid SMTP settings.
- Runtime-generated models are in-memory unless persisted by custom implementation.

## Useful Docs

- Backend details: `backend/README.md`
- Frontend details: `frontend/README.md`
- API schema: `backend/swagger.yaml`
