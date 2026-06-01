# Setup and Run Instructions

This document explains how to configure and host the TV Display Dashboard using Firebase and GitHub Pages.

## 1. Firebase Configuration

The application uses Firebase Realtime Database to sync data instantly between the Editor and the Display. The configuration is already embedded in `app.js` and `editor.js`.

If you ever need to change the Firebase project, you will need to update the `firebaseConfig` object at the top of both `app.js` and `editor.js`.

## 2. Local Testing

Since this is a purely static site, you don't need to run a Node.js server to test it. 
However, for ES modules to load correctly in modern browsers, you should serve the folder using a basic local web server:

```bash
# Using Python
python -m http.server 3000

# Using Node/npx
npx serve .
```

Open `http://localhost:3000/index.html` to view the display, and `http://localhost:3000/editor.html` to open the editor.

<<<<<<< Updated upstream
The server requires an admin username, password, and MongoDB Atlas connection string to be set via environment variables. Create a `.env` file in the project root with the following values:

```
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-strong-password
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=tv_display
MONGODB_COLLECTION=metrics
# Optional: PORT=3001
```
=======
## 3. GitHub Pages Hosting

Deploying to GitHub Pages is extremely simple:
>>>>>>> Stashed changes

1. Push all these files (`index.html`, `editor.html`, `app.js`, `editor.js`) to the `main` branch of a GitHub repository.
2. Go to your repository **Settings** on GitHub.
3. Click on **Pages** in the left sidebar.
4. Under **Source**, select `Deploy from a branch`.
5. Under **Branch**, select `main` (or `master`) and `/ (root)`.
6. Click **Save**.

<<<<<<< Updated upstream
```powershell
@"
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-strong-password
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=tv_display
MONGODB_COLLECTION=metrics
"@ > .env
```

Before starting the server, make sure your Atlas cluster is ready:

1. Create a database user in Atlas and copy the connection string.
2. Add your current IP address to the Atlas Network Access list.
3. Use database and collection names that match the values in your `.env` file.
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

**Next steps**

- Customize the document stored in MongoDB Atlas to contain the dashboard metadata and values used by the UI.
- For production deployment, run behind a process manager (PM2/systemd) and/or a reverse proxy.
=======
Within a couple of minutes, your site will be live at `https://<your-username>.github.io/<repository-name>/`.
Access the editor by navigating to `https://<your-username>.github.io/<repository-name>/editor.html`.
>>>>>>> Stashed changes
