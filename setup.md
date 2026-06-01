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

## 3. GitHub Pages Hosting

Deploying to GitHub Pages is extremely simple:

1. Push all these files (`index.html`, `editor.html`, `app.js`, `editor.js`) to the `main` branch of a GitHub repository.
2. Go to your repository **Settings** on GitHub.
3. Click on **Pages** in the left sidebar.
4. Under **Source**, select `Deploy from a branch`.
5. Under **Branch**, select `main` (or `master`) and `/ (root)`.
6. Click **Save**.

Your site is currently live at:
- **TV Display:** `https://dunbrae.github.io/TV/`
- **Editor Panel:** `https://dunbrae.github.io/TV/editor.html`
