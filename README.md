# Calculator App

A small calculator with an Express backend and a dependency-free static frontend.
The backend serves both the API and the UI from the same origin, so the frontend
calls relative paths (`/api/calculate`) — no CORS configuration needed.

## Layout

```
backend/
  server.js              # HTTP entrypoint (PORT / HOST env vars)
  app.js                 # Express app: API routes + static frontend
  src/calculator.js      # Pure calculation + validation logic
  test/                  # node:test unit and API tests
frontend/
  index.html, styles.css, app.js
```

## Run

```bash
npm install
npm start           # http://localhost:3000
PORT=8080 npm start # custom port
```

## Test

```bash
npm test
```

## API

### `GET /api/health`

```json
{ "status": "ok", "operations": ["add", "subtract", "multiply", "divide"] }
```

### `POST /api/calculate`

Request:

```json
{ "operation": "add", "a": 12, "b": 4 }
```

Response `200`:

```json
{ "operation": "add", "a": 12, "b": 4, "result": 16 }
```

Operands may be numbers or numeric strings. Invalid input returns `400` with
`{ "error": "..." }` — unsupported operation, non-finite operand, or division by
zero.
