# Banking API

Node.js + Express + MongoDB backend for core banking workflows with security and reliability controls.

## Features

- User registration and login with JWT auth
- Account creation and balance lookup
- Money transfer between accounts
- System-only initial funding endpoint
- Ledger-based balance calculation using immutable ledger entries
- Idempotent transaction handling (`idempotencyKey`)
- Structured request logging with `pino` + `pino-http`
- Rate limiting with `express-rate-limit` (global + route-level)
- Joi schemas available for payload validation (`utils/schema.js`)
- Email notifications for registration and transfers

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Cookie parsing (`cookie-parser`)
- Validation (`joi`)
- Logging (`pino`, `pino-http`, `pino-pretty`)
- Rate limiting (`express-rate-limit`)
- Email (`nodemailer`)

## Project Structure

```text
.
|-- controllers/
|-- middleware/
|-- models/
|-- routes/
|-- src/
|   |-- app.js
|   `-- config/db.js
|-- utils/
|   |-- logger.js
|   |-- rateLimit.js
|   |-- schema.js
|   `-- sendEmail.js
`-- server.js
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Create `.env`

```env
PORT=3000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

Notes:

- `PORT` is optional (defaults to `3000`).
- `NODE_ENV=production` enables `trust proxy` and production-friendly logging level.
- `EMAIL_USER` and `EMAIL_PASS` are used by `nodemailer` (Gmail transport).

### 3) Run the server

```bash
npm run dev
```

Server starts only after successful DB connection.

## Auth Behavior

Protected routes accept token in either:

- Cookie: `token`
- Header: `Authorization: Bearer <jwt>`

## Observability and Protection

### Logging (`pino`)

- HTTP request/response logging via `pino-http`
- Redacts sensitive headers (`req.headers.cookie`, `req.headers.authorization`)
- Pretty console output in non-production (`pino-pretty`)

### Rate Limits

- Global limiter: `100` requests / `15` minutes per IP
- Auth limiter (`/api/auth`): `10` requests / `15` minutes per IP
- Transaction limiter (`/api/transaction`): `5` requests / minute per IP

### Validation and Consistency

- Joi schemas are defined for user and transaction payloads in `utils/schema.js`
- Mongoose schema constraints validate model-level data integrity
- Transfer flow uses MongoDB sessions/transactions for atomic writes
- Balance re-check after ledger writes helps detect race conditions
- Unique `idempotencyKey` protects against duplicate transaction processing

## API Endpoints

Base URL (local): `http://localhost:3000`

### Auth

#### `POST /api/auth/register`

Creates a user and sets auth cookie.

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

#### `POST /api/auth/login`

Logs in an existing user and sets auth cookie.

Request body:

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

### Accounts (Auth Required)

#### `POST /api/accounts`

Creates an account for the logged-in user.

#### `GET /api/accounts`

Returns all accounts owned by the logged-in user.

#### `GET /api/accounts/balance/:accountId`

Returns ledger-derived balance for a specific account owned by the logged-in user.

### Transactions

#### `POST /api/transaction` (Auth Required)

Creates a money transfer between accounts with idempotency protection.

Request body:

```json
{
  "fromAccount": "account_id_1",
  "toAccount": "account_id_2",
  "amount": 500,
  "idempotencyKey": "txn-001"
}
```

Behavior:

- Only owner of `fromAccount` can transfer
- Both accounts must be `Active`
- Duplicate `idempotencyKey` returns existing transaction state
- Transfer writes run in a DB session for atomicity
- On success, creates one `DEBIT` and one `CREDIT` ledger entry

#### `POST /api/transaction/system/initialfunds` (System User Required)

Adds initial funds to an account.

Request body:

```json
{
  "toAccount": "account_id",
  "amount": 1000,
  "idempotencyKey": "seed-001"
}
```

This route is protected by `authSystemMiddleware`, so the authenticated user must have `systemUser: true`.

## Data Model Notes

- `User`: unique email, hashed password, hidden immutable `systemUser` flag
- `Account`: linked to user, status (`Active | Frozen | Closed`), balance from ledger
- `Transaction`: status (`Pending | Completed | Failed | Reversed`), unique `idempotencyKey`
- `Ledger`: immutable entries; `CREDIT` adds and `DEBIT` subtracts from balance

## Quick Test Flow

1. Register user A
2. Login user A
3. Create account for user A
4. Register/login user B and create account
5. Transfer using `POST /api/transaction`
6. Check balances with `GET /api/accounts/balance/:accountId`

To use system funding route:

1. Create a user that will act as system user
2. Set `systemUser: true` for that user in MongoDB
3. Login as that user
4. Call `POST /api/transaction/system/initialfunds`

## Available Script

```bash
npm run dev
```
