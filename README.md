<div align="center">
  <img src="public/assets/app-icon.png" alt="PLAY-ON! Logo" width="120" />
  <h1>PLAY-ON!</h1>
  <p><strong>🎬 Automatic Anime Tracking for Desktop</strong></p>
  <p>Detects what you're watching and syncs progress to AniList — effortlessly.</p>

  ![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
  ![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
  ![Rust](https://img.shields.io/badge/Rust-Backend-orange?logo=rust)
  ![License](https://img.shields.io/badge/License-MIT-green)
</div>

---

## ✨ Features

- **🔍 Auto-Detection** — Detects anime playing in VLC, MPV, MPC, PotPlayer, and more
- **📝 Smart Title Parsing** — Handles fansub formats, underscores, dots, season/episode patterns
- **🔗 AniList Integration** — OAuth login and automatic progress sync
- **💾 Local-First** — Saves progress locally first, syncs to cloud in background
- **📴 Offline Support** — Queues updates when offline, syncs when reconnected
- **🎨 Modern UI** — Beautiful pastel theme with smooth animations

## 🖼️ Preview

| Now Playing | Anime List |
|-------------|------------|
| Detects currently playing anime with cover art | Browse and filter your anime collection |

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/PLAY-ON.git
cd PLAY-ON

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

## 🔧 How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Media Player   │ ──▶ │  Window Title    │ ──▶ │  Title Parser   │ ──▶ │   AniList    │
│  (VLC, MPV...)  │     │  Detection       │     │  + AniList API  │     │   Sync       │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └──────────────┘
```

1. **Detect** — Monitors active windows for media players
2. **Parse** — Extracts anime title & episode from filename
3. **Match** — Searches AniList progressively (word-by-word)
4. **Save** — Updates local database instantly
5. **Sync** — Pushes progress to AniList in background

## 📁 Project Structure

```
PLAY-ON!/
├── src/                    # React Frontend
│   ├── components/         # UI Components
│   ├── lib/                # Core libraries
│   │   ├── localAnimeDb.ts # Local storage database
│   │   ├── syncService.ts  # AniList sync service
│   │   └── apollo.ts       # GraphQL client
│   └── pages/              # Route pages
├── src-tauri/              # Rust Backend
│   └── src/
│       ├── lib.rs          # Tauri commands
│       ├── title_parser.rs # Anime title parser
│       ├── anilist.rs      # AniList API client
│       └── media_player.rs # Player detection
└── public/                 # Static assets
```

## 🎯 Supported Media Players

| Player | Status |
|--------|--------|
| VLC Media Player | ✅ |
| MPV | ✅ |
| MPC-HC / MPC-BE | ✅ |
| PotPlayer | ✅ |
| KMPlayer | ✅ |
| GOM Player | ✅ |
| Windows Media Player | ✅ |

## 🔐 AniList Setup

1. Go to [AniList Developer Settings](https://anilist.co/settings/developer)
2. Create a new client with redirect URL: `playon://auth`
3. Add your Client ID and Secret to the app settings

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | Rust, Tauri 2.0 |
| **API** | Apollo Client, GraphQL |
| **Styling** | CSS with pastel theme |
| **Storage** | localStorage + AniList |

## 📝 License

MIT License — feel free to use and modify!

---

<div align="center">
  <p>Made with ❤️ for anime fans</p>
  <p>
    <a href="https://anilist.co">AniList</a> •
    <a href="https://tauri.app">Tauri</a> •
    <a href="https://react.dev">React</a>
  </p>
</div>
