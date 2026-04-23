# Fastee — Thumbnail Generator

A Gen Z-style social media thumbnail & image creator built with **Vue 3**, **Konva.js**, and a minimal **Node.js/Express** backend. Design platform-specific images for YouTube, TikTok, Facebook, and Instagram — entirely in the browser.

![Fastee preview](https://placehold.co/1280x640/1e1b4b/a5b4fc?text=Fastee+Thumbnail+Generator)

---

## Features

- **12 image types** across 4 platforms — YouTube (Video, Shorts), TikTok (Video, Live), Facebook (Post, Cover, Story, Reel, Avatar), Instagram (Post, Reel, Story)
- **Canvas editor** powered by Konva.js — drag, resize, rotate, and flip elements with center-pivot accuracy
- **Inline text editing** — double-click any text element to edit directly on the canvas
- **Image upload** — upload a background image or add extra images via file picker, paste, or drag-and-drop
- **Export** as PNG or JPG at full resolution
- **Snap & alignment guides** — smart snapping to canvas edges, center lines, and other elements
- **Undo / Redo** with full history stack
- **Auto-save** — changes are debounced and saved to `localStorage`, scoped per platform × image type
- **Collapsible left panel** — more canvas space when you need it
- **Space-to-pan** — hold Space and drag to pan the canvas (Photoshop-style)
- **Zoom controls** — `+` / `−` buttons, Fit, and `Ctrl+Scroll`
- **Light / Dark mode** toggle
- **Keyboard shortcuts**: `Del` remove · `Ctrl+Z/Y` undo/redo · `Ctrl+D` duplicate · Arrow keys nudge (+ Shift for ×10)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3 + Vite, TypeScript |
| Canvas | Konva.js + Vue Konva |
| State | Pinia |
| Styling | Tailwind CSS |
| Backend | Node.js + Express (TypeScript) |
| Deploy | Docker Compose |

---

## Project Structure

```
thumbnail-fastee/
├── frontend/               # Vue 3 + Vite app
│   └── src/
│       ├── components/     # Canvas, layout (TopBar, LeftPanel, RightPanel), UI widgets
│       ├── composables/    # useCanvas, useExport, useAutoSave, useColorMode
│       ├── store/          # Pinia editor store
│       ├── types/          # TypeScript interfaces & constants
│       ├── templates/      # Bundled template JSON files
│       └── views/          # HomeView, ImageTypeView, EditorView
├── backend/                # Express API
│   └── src/
│       ├── controllers/    # configController, templatesController
│       ├── data/templates/ # Template JSON files served by the API
│       └── routes/
├── docker-compose.yml
└── .env.example
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Clone & install

```bash
git clone https://github.com/danganh97/thumbnail-fastee.git
cd thumbnail-fastee

npm install
```

### 2. Configure environment

Copy `.env.example` to root `.env` and edit it:

```bash
cp .env.example .env
```

All frontend and backend env vars are loaded from the root `.env`.

### 3. Run in development

Run both apps from repo root:

```bash
npm run dev
```

Or run one workspace at a time:

```bash
npm run dev:api
npm run dev:web
```

Then open [http://localhost:5173](http://localhost:5173).

---

## Docker Compose (recommended)

```bash
docker compose up
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/config` | Returns platforms, image types, fonts |
| `GET` | `/api/templates` | Returns all template definitions |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Del` / `Backspace` | Remove selected element |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + D` | Duplicate selected element |
| `Ctrl + S` | Save to browser storage |
| `Arrow keys` | Nudge element 1px |
| `Shift + Arrow` | Nudge element 10px |
| `Space + Drag` | Pan canvas |
| `Ctrl + Scroll` | Zoom in / out |
| `Dbl-click text` | Inline text edit |

---

## License

MIT
