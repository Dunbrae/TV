# TV Display Backend

Lightweight Node.js + Express app that serves the TV dashboard and stores its content in MongoDB Atlas.

## Requirements

- Node.js 18+ recommended
- npm

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

The server runs on port `3001` by default and listens on `http://0.0.0.0:3001`.

## Environment

Set these before starting the server:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PORT` (optional)
- `MONGODB_URI`
- `MONGODB_DB` (optional, defaults to `tv_display`)
- `MONGODB_COLLECTION` (optional, defaults to `metrics`)

## API

### `GET /api/metrics`
Returns the dashboard payload stored in MongoDB Atlas.

### `POST /api/metrics`
Overwrites the stored dashboard payload with the JSON body from the request.

Example request:

```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d "{\"monthInvoiced\":123,\"monthTarget\":456}"
```

## Dashboard

Open `http://localhost:3001/` for the TV view and `http://localhost:3001/admin` for the editor.

The dashboard pulls its title, labels, ranges, and values from MongoDB Atlas. If you are opening it from another device on the network, use the host machine's LAN IP instead of `localhost`.

## Admin Editor

Open `http://localhost:3001/admin` to sign in and edit the values.

Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `MONGODB_URI` in the environment before launch, and add your IP to the Atlas Network Access list.
