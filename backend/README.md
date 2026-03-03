# Backend (Dynamic CRUD)

This directory contains the server-side implementation of the dynamic CRUD application. The backend is built with **Express** and **TypeScript**, using **MongoDB** via Mongoose for data storage. It exposes authentication flows, user management, and a flexible mechanism for dynamically creating and interacting with other data entities.

## Key Features

- **Authentication** with email verification, password hashing, JWT tokens.
- **Admin role enforcement** (only a configured admin email gets admin privileges).
- **Dynamic entity generation**: define new models at runtime with custom fields.
- **CRUD operations** for any registered entity via a single controller.
- **Pagination** built into listing endpoints.
- **User management** interface protected by admin role checks.
- **Password reset & email resend flows**.

## Getting Started

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configuration**
   - Create a `.env` file at project root (copy from `.env.example` if available).
   - Required variables:
     ```text
     MONGODB_URI=your-mongo-connection-string
     JWT_SECRET=some-long-secret
     ADMIN_EMAIL=admin@example.com          # the account that receives admin privileges
     FRONTEND_URL=http://localhost:5173    # used for verification/reset links
     # Mailer settings (e.g. SMTP_HOST, SMTP_USER, SMTP_PASS, etc.)
     ```
   - Adjust other env vars as needed for environment.

3. **Development**
   ```bash
   npm run dev
   ```
   This runs `ts-node-dev` to automatically restart the server on file changes.

4. **Production Build**
   ```bash
   npm run build   # compiles TypeScript to /dist
   npm start       # runs the compiled code
   ```

## Directory Overview

```
backend/
  src/
    app.ts               # entrypoint, middleware setup
    controllers/
      authController.ts  # registration, login, password flows, email verification
      dynamicController.ts # generic CRUD handler and dynamic model creation
    middleware/
      authMiddleware.ts  # JWT extraction and user attachment
      requireRole.ts     # role-based authorization helper
    models/
      User.ts            # user schema and static helpers
    routes/
      authRoutes.ts
      dynamicRoutes.ts   # handles /api/:entity with admin checks for User
    utils/
      emailService.ts    # wrapper around nodemailer for sending emails
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Route                   | Description |
|--------|-------------------------|-------------|
| POST   | `/register`             | Create user account. Sends verification email. Returns user object (no token). **Errors:** 400 if email/password missing or phone invalid, 409 if user/phone already exists, 500 on server error. |
| POST   | `/login`                | Authenticate with email/password. Returns `{ token, user }` after verifying active/verified status. **Errors:** 400 when missing email/password, 401 invalid credentials, 403 if unverified/inactive, 500 on server error. |
| POST   | `/forgot-password`      | Generates reset token and emails link (if account exists). **Errors:** 400 if email missing, 500 on server error. Always responds with success message to avoid enumeration. |
| POST   | `/reset-password`       | Accepts token + new password to update account. **Errors:** 400 for missing fields or invalid/expired token, 500 on server error. |
| POST   | `/verify-email`         | Verify account using token from email. **Errors:** 400 for missing or invalid token, 500 on server error. |
| POST   | `/resend-verification`  | Reissue verification token & email if not yet verified. **Errors:** 400 for missing email, user not found, or already verified; 500 on server error. |

### Dynamic CRUD (`/api/:entity`)

- `GET`  retrieves documents. If `:id` param provided, returns single.
  - Supports pagination via `?page=<n>&limit=<n>`.
  - Errors: 400 for invalid ID format, 404 if not found (when id given), 500 on server error.
- `POST` creates a new document.
  - Errors: 400 for validation failures, 500 on server error.
- `PUT /:id` updates a document by id.
  - Errors: 400 if missing id or invalid data, 404 if document not found, 500 on server error.
- `DELETE /:id` deletes a document by id.
  - Errors: 400 if missing id, 404 if not found, 500 on server error.

> **Special handling for User entity:** all list/update/delete operations require admin role; enforced in `dynamicRoutes.ts` using `requireRole("admin")`.

### Model Generation

- `POST /api/generate` with `{ entityName: string, fields: Record<string,string> }` will create a new Mongoose model at runtime. Useful for building admin-configurable resources.
- Newly generated models are stored in memory (not persistent across restarts).

## Auth & Security

- **Password hashing** uses `bcryptjs` with a salt rounds of 10.
- **JWT tokens** are signed using `JWT_SECRET` and expire in 7 days. Tokens are only issued on login, not registration.
- The `authMiddleware` reads `Authorization` header and verifies the token, attaching the user to `req.user` for downstream handlers.
- `requireRole` middleware checks that the logged-in user has the specified role (e.g. "admin").

## Email Service

- Located in `src/utils/emailService.ts`, which exports `sendVerificationEmail` and `sendPasswordResetEmail`.
- Uses Nodemailer with the SMTP settings provided via environment variables.
- Emails are sent asynchronously; failures are logged but do not prevent the main flow.

## Pagination

Listing endpoints default to **10 documents per page**. Query parameters:

- `page`: 1-based page number (defaults to 1).
- `limit`: number of items per page (defaults to 10).

Responses include:
```json
{ "docs": [ ... ], "total": 42, "page": 2, "pages": 5 }
```

## User Sanitization

Before sending users back to clients, sensitive fields are removed:
- `password`
- `isVerified` / `isActive` internal flags
- `resetToken` / `resetTokenExpiry` / `verificationToken`

This logic lives in `authController.sanitizeUser`.

## Development Tips

- Run `npm run dev` in backend and `npm run dev` in frontend concurrently for full stack development.
- Use Postman or curl to exercise the `/api/auth` and `/api/User` endpoints directly.
- When generating new entities with `/api/generate`, restart the server to make the models persistent or add manual Mongoose schemas in `src/models`.

## Troubleshooting

- If emails are not sending, verify SMTP credentials and check console logs for errors.
- For CORS issues, adjust settings in `app.ts` where `cors()` is applied.

Refer to the TypeScript source under `src/` for implementation details and comments.

---

## Architecture Design

The backend follows a modular, layered structure:

1. **Entry point (`app.ts`)** – sets up Express, applies global middleware (CORS, JSON body parsing), and mounts routers.
2. **Routes** – defined under `src/routes`; `authRoutes` handles authentication and `dynamicRoutes` serves as a generic CRUD entrypoint for any entity. Role-based guards are applied here.
3. **Controllers** – business logic lives in `src/controllers`. `authController` encapsulates all auth-related workflows while `dynamicController` performs generic CRUD operations and dynamic schema creation.
4. **Middleware** – `authMiddleware` decodes JWTs and attaches user info; `requireRole` enforces role checks.
5. **Models** – Mongoose schemas are under `src/models`. The `User` schema includes pre-save hooks and helper methods where appropriate. Dynamic models are generated in-memory at runtime by the `dynamicController`.
6. **Utilities** – cross-cutting helpers such as the email sending service (`src/utils/emailService.ts`).
7. **Configuration** – environment variables configure database connections, JWT secrets, email settings, and allowed admin address.

### Data Flow

- Incoming HTTP request -> Route -> (optional) Middleware -> Controller -> Model interaction -> Response.
- For GET lists, pagination parameters are parsed in the controller and Mongoose `find().skip().limit()` is used.
- Sensitive data is removed from model objects before sending responses.

### Extensibility

- The dynamic model generator allows new entities without modifying code -- just POST a JSON definition.
- Additional middleware (logging, rate limiting) can be added in `app.ts` or per-router.
- Services like email, password hashing, and JWT handling are abstracted to make swapping implementations easy.

Happy coding!