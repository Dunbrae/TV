# Setup and Run Instructions

This document explains how to install, configure, and run the TV Display backend locally with MongoDB Atlas.

**Prerequisites**

- Node.js 18+ (LTS recommended)
- npm (comes with Node.js)

**Install dependencies**

Run from the project root:

```bash
npm install
```

**Environment configuration**

The server requires an admin username, password, MongoDB Atlas connection string, and a signing secret to be set via environment variables. Create a `.env` file in the project root with the following values:

```
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-strong-password
AUTH_SECRET=generate-a-long-random-string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=tv_display
MONGODB_COLLECTION=metrics
# Optional: PORT=3001
```

On Windows PowerShell you can create the file with:

```powershell
@"
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-strong-password
AUTH_SECRET=generate-a-long-random-string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=tv_display
MONGODB_COLLECTION=metrics
"@ > .env
```

Before starting the server, make sure your Atlas cluster is ready:

1. Create a database user in Atlas and copy the connection string.
2. Add your current IP address to the Atlas Network Access list.
3. Use database and collection names that match the values in your `.env` file.
4. Generate a strong `AUTH_SECRET` and keep it the same across deploys.

You do not need a local `data.json` file anymore.

**Development**

Run the development server (auto-restarts on change):

```bash
npm run dev
```

This uses `ts-node-dev` and serves the static dashboard pages from the `public/` directory. The default port is `3001` unless `PORT` is set.

The server binds to `0.0.0.0`, so other devices on the same network can reach it once the app is running and the firewall allows the port.

Open these URLs in your browser:

- TV view: http://localhost:3001/
- Admin editor: http://localhost:3001/admin

**Build and Production**

Compile TypeScript to JavaScript and run the compiled server:

```bash
npm run build
npm start
```

The compiled entrypoint is `dist/server.js` (see `package.json` scripts).

**API**

- `GET /api/metrics` — Returns the stored dashboard payload from MongoDB Atlas.
- `POST /api/metrics` — Requires authentication. Overwrites the stored dashboard payload with the supplied JSON body.

To call the `POST` endpoint from the admin UI, sign in at `/admin` to obtain a bearer token. Example curl (replace `<TOKEN>`):

```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"monthInvoiced":123,"monthTarget":456}'
```

**Troubleshooting & Notes**

- If the server exits with an error instructing you to set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, or `MONGODB_URI`, verify your `.env` file is present and correctly formatted.
- If the chosen `PORT` is in use, the server will automatically try the next port and log a warning.
- If Atlas rejects the connection, confirm your IP is on the Network Access list and the connection string uses the correct username, password, and cluster hostname.
- If login stops working after a redeploy, confirm `AUTH_SECRET` has not changed.

**Next steps**

- Customize the document stored in MongoDB Atlas to contain the dashboard metadata and values used by the UI.
- For production deployment, run behind a process manager (PM2/systemd) and/or a reverse proxy.
