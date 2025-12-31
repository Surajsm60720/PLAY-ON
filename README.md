<div align="center">
  <img src="public/assets/app-icon.png" alt="PLAY-ON! Logo" width="120" />
  <h1>PLAY-ON!</h1>
  <p><strong>🎬 Simple Anime Tracking for Desktop</strong></p>
  <p>A desktop application to help you keep track of what you're watching locally.</p>

  ![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
  ![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
  ![Rust](https://img.shields.io/badge/Rust-Backend-orange?logo=rust)
</div>

---

## 🛠️ Current Features

- **Media Detection** — Basic detection for media players like VLC and MPV on Windows.
- **Title Parsing** — Attempts to grab anime titles and episode numbers from window titles.
- **AniList Sync** — Connect your account to keep your list updated (requires setup).
- **Local Library** — Keeps track of the folders you've added to the sidebar.
- **Cache Management** — Options to clear all local data and restart the app.

## 🚀 How to Run Exactly

To run this project on your own machine, follow these steps:

### 1. Prerequisites
- **Node.js**: (v18 or newer)
- **Rust**: [Install via rustup.rs](https://rustup.rs/)
- **Tauri Prerequisites**: See the [Tauri Setup Guide](https://v2.tauri.app/start/prerequisites/) for your OS (Visual Studio C++ Build Tools for Windows).

### 2. Setup Environment Variables
Clone the repo and create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Open `.env` and fill in your AniList API credentials:
- `VITE_ANILIST_CLIENT_ID`: Your AniList Developer Client ID
- `VITE_ANILIST_CLIENT_SECRET`: Your AniList Developer Client Secret

### 3. Install and Run
Run the following commands in your terminal:

```bash
# Install Node dependencies
npm install

# Run in development mode
npm run tauri dev
```

### 4. Build for Production
To create a standalone installer for your OS:

```bash
npm run tauri build
```

## 🔐 Notes on Connectivity

The app uses custom protocol handling (`playon://`) for AniList login. If you have trouble logging in, use the **"Trouble logging in?"** link in the sidebar or onboarding page to paste your authorization code manually.

---

## 🏗️ Project Stack

- **Frontend**: React 19, Vite, Apollo Client (GraphQL)
- **Backend**: Rust, Tauri 2.0
- **Storage**: LocalStorage & AniList API

---

<div align="center">
  <p>Experimental project for personal use.</p>
</div>
