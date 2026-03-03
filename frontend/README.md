# Frontend (AI Dynamic CRUD)

React application built with Vite that consumes the backend API.

## Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment**
   - Configure `VITE_API_BASE` in `.env` if your backend is not running on `http://localhost:5000/api`.

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm run preview  # optional to test the build
   ```

## Features

- User registration/login with email verification.
- Admin dashboard shows user statistics and allows managing users.
- Pagination on user listing.
- Password recovery and email resend flows.

## Notes

- Tokens are stored in `localStorage` after login.
- The dashboard tests user role before rendering admin views.
- Components and services are under `src/`.

Feel free to customize styles or add more pages as required.