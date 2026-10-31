# Sabai · Massage reservations

A responsive massage reservation app built with **Node.js, Express 5, and MongoDB (Mongoose)**. The client is plain JavaScript, HTML, and CSS, served by Express. No frontend build step.

## Run locally

1. Install Node.js 22 or later (Node 20.17 also works for local development).
2. Run `npm install`.
3. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell).
4. Run `npm start` and open **http://localhost:3000**.

With `MONGODB_URI` empty, development starts an actual local MongoDB process using `mongodb-memory-server`. The first start downloads the MongoDB binary and needs internet access. The development database persists in `data/`; the downloaded binary is cached in `.cache/`. No fake API or browser-storage database is used.

Alternatively, connect your own MongoDB instance through `MONGODB_URI`. For a local Docker database, run `docker compose up -d` and set `MONGODB_URI=mongodb://127.0.0.1:27017/sabai`.

## Project structure

The backend follows the same organization as the VacQ67 reference:

```text
backend/
  config/        # MongoDB connection, seed catalog, validation schemas
  controllers/   # Authentication, shops, and reservation request handlers
  middleware/    # Authentication checks and API error handling
  models/        # User, Shop, and Reservation Mongoose models
  routes/        # Express route definitions, including admin routes
  utils/         # Shared HTTP error helper
  app.js         # Express setup, sessions, security, and route mounting
  server.js      # Database startup, HTTP listener, and shutdown
public/          # Frontend HTML, CSS, and JavaScript
test/            # API integration tests
```

Run `npm start` or `npm run dev` from the project root. Environment variables
remain in the root `.env`; database files and the MongoDB binary cache remain
in the root `data/` and `.cache/` directories.

## Administrator

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in `.env`, then restart. Startup creates the administrator **only if that email does not already exist**. Use a new email for the initial administrator. Existing accounts are never silently promoted or have passwords reset. Log in normally to reveal **Admin dashboard**.

There are no default credentials. Registration always creates a regular user, regardless of the request's `role` field. The role is checked against the database on every protected request.

## Included behavior

- Register with name, telephone, email, and password; sign in and sign out.
- Password hashing with bcrypt; MongoDB-backed sessions in HttpOnly cookies.
- Browse six fictional Bangkok shops with addresses, phone numbers, hours, and treatments.
- Filter shops by treatment or neighborhood and search by name/address.
- Reserve a shop, date, time, treatment, and duration; see the price before confirming.
- Maximum **three upcoming reservations per user**, enforced with a unique partial MongoDB index, including under concurrent requests. Completed reservations release their quota on the next booking.
- View, reschedule (including changing shops), or delete your reservations. Completed records can also be rescheduled into the future when a quota slot is available.
- Admins can view all guests' reservations, reschedule any reservation, and delete any reservation.
- Server-side validation of ownership, treatment availability, future dates, and opening hours. Appointment times use **Asia/Bangkok (UTC+7)**; starts are on 30-minute boundaries and treatments must finish before closing.
- Accessible native dialogs, keyboard focus, responsive layouts, empty/error/loading states, and confirmation before cancellation.

The sample shops, addresses, and phone numbers are demonstration data. Images are illustrative Unsplash photos, not photos of real partner shops. Reservations are stored in this app and do not notify businesses. Payment is made at the shop; no payment processor is included. Per-shop therapist capacity is not modeled by the provided requirements.

## Tests

`npm test` runs integration tests against a separate, temporary real MongoDB database. It checks registration, duplicate emails, password login, logout, privilege escalation, ownership, admin access, editing/deletion, past/out-of-hours dates, and simultaneous booking requests exceeding the limit. Tests never use the configured production database.

## API

JSON request bodies. All write requests require `X-Requested-With: Sabai`. Authentication is via the session cookie, not a client-stored token. Responses containing private data use `Cache-Control: no-store`.

| Method | Path                      | Purpose                                                      |
| ------ | ------------------------- | ------------------------------------------------------------ |
| POST   | `/api/auth/register`      | `{name, telephone, email, password}`                         |
| POST   | `/api/auth/login`         | `{email, password}`                                          |
| POST   | `/api/auth/logout`        | Destroy session                                              |
| GET    | `/api/auth/me`            | Current user, or `null`                                      |
| GET    | `/api/shops`              | Shops and treatment catalog                                  |
| GET    | `/api/reservations`       | Signed-in user's reservations                                |
| POST   | `/api/reservations`       | `{shop, date:"YYYY-MM-DD", time:"HH:mm", service, duration}` |
| PATCH  | `/api/reservations/:id`   | Replace booking details; owner or admin                      |
| DELETE | `/api/reservations/:id`   | Delete; owner or admin                                       |
| GET    | `/api/admin/reservations` | All reservations with guest details; admin only              |

## Production

Set `NODE_ENV=production`, a real `MONGODB_URI`, and a random `SESSION_SECRET` of at least 32 characters. Serve behind HTTPS: production cookies are secure. The app trusts one reverse proxy; adjust that setting for your actual infrastructure. MongoDB needs permission to create the required unique indexes and the sessions TTL index. The embedded development database is deliberately disabled in production.

For an eventual Vercel deployment, install the CLI with `npm i -g vercel` to enable `vercel env pull`, `vercel deploy`, and `vercel logs`. This project is not deployed or connected to a cloud database automatically.
