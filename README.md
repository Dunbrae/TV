# TV Display Backend

Lightweight Node.js + Express app that serves the TV dashboard and stores its content in JSONBin when configured, with a local `data.json` fallback for development.

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

The server runs on port `3001` by default and listens on `http://localhost:3001`.

## Environment

Set these before starting the server:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PORT` (optional)
- `JSONBIN_BIN_ID` to use JSONBin instead of `data.json`
- `JSONBIN_API_KEY` to save updates to a private bin

If `JSONBIN_BIN_ID` is not set, the app keeps using the local `data.json` file.

## API

### `GET /api/metrics`
Returns the parsed contents of JSONBin when `JSONBIN_BIN_ID` is set, otherwise `data.json`.

The file also carries dashboard metadata such as the page title, section labels, and date ranges.

### `POST /api/metrics`
Overwrites JSONBin when configured, otherwise `data.json`, with the JSON body from the request.

Example request:

```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d "{\"monthInvoiced\":123,\"monthTarget\":456}"
```

## Dashboard

Open `http://localhost:3001/` for the TV view and `http://localhost:3001/admin` for the editor.

The dashboard pulls its title, labels, ranges, and values from JSONBin when configured, otherwise `data.json`.

## Admin Editor

Open `http://localhost:3001/admin` to sign in and edit the values.

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the environment before launch.
