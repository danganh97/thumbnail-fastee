# Thumbnail Generator Web App (Gen Z Style) — Full Plan

## 1. Overview
A lightweight, frontend-heavy web app for creating social media thumbnails:
- YouTube (1280x720)
- TikTok (1080x1920)
- Facebook (1200x628)

Core philosophy:
- Minimal UI
- Fast UX (<30s to export)
- No heavy backend or storage

---

## 2. Tech Stack

### Frontend
- Vue 3 (Vite)
- TailwindCSS
- Konva.js (canvas rendering)
- Pinia (state management)
- Framer Motion alternative: VueUse Motion

### Backend (minimal)
- Node.js + Express
- Only serves:
  - /config
  - /templates

### Hosting
- Frontend: Vercel / Netlify
- Backend: Railway / Fly.io

---

## 3. Architecture

### Frontend-heavy design
- All image processing in browser
- No file uploads to server
- Templates stored as JSON

### Backend role
- Optional
- Dynamic config update without redeploy

---

## 4. Features (MVP)

### Core
- Select platform preset
- Load template
- Edit text
- Upload image
- Drag/resize elements
- Export PNG/JPG

### UX Rules
- 3–4 clicks to export
- No complex settings
- Instant feedback

---

## 5. UI Layout

Top Bar:
- Logo
- Download button

Left Panel:
- Platform selector
- Template list

Center:
- Canvas (Konva)

Right Panel:
- Text settings
- Color / font

---

## 6. UX Flow

1. Select platform
2. Choose template
3. Edit text
4. Download

---

## 7. JSON Template Structure

```
{
  "name": "youtube_basic",
  "width": 1280,
  "height": 720,
  "elements": [
    {
      "type": "text",
      "text": "YOUR TITLE",
      "x": 100,
      "y": 100,
      "fontSize": 80,
      "color": "#ffffff",
      "stroke": "#000000"
    }
  ]
}
```

---

## 8. Canvas System

Use Konva:
- Stage
- Layer
- Text
- Image

Support:
- drag
- resize
- transform

---

## 9. State Management (Pinia)

Store:
- currentTemplate
- elements
- selectedElement
- history (optional)

---

## 10. Export Logic

```
stage.toDataURL({
  pixelRatio: 2
})
```

Download as PNG.

---

## 11. Performance

- Use requestAnimationFrame
- Avoid re-render full canvas
- Lazy load fonts

---

## 12. Templates Strategy

Each platform:
- 3–5 templates

Naming:
- "YouTube Viral"
- "TikTok Hook"
- "Facebook Sale"

---

## 13. Fonts

- Inter
- Poppins
- Bebas Neue

Load via Google Fonts or local

---

## 14. Styling

- Rounded UI (12–20px)
- Soft shadows
- Gradient accents
- Dark/light mode optional

---

## 15. Animations

- Hover scale
- Fade in
- Drag smooth

---

## 16. Backend API (optional)

GET /config
GET /templates

Response JSON only

---

## 17. Folder Structure

Frontend:
- src/
  - components/
  - canvas/
  - store/
  - templates/
  - assets/

Backend:
- routes/
- controllers/
- config/

---

## 18. Development Timeline

Week 1:
- Canvas + basic editing

Week 2:
- Templates + UI polish

---

## 19. Future Enhancements

- Save project (localStorage)
- Share via URL
- Premium templates
- Auth system

---

## 20. Key Principles

- Simplicity > features
- Speed > perfection
- UX > everything

---

## 21. Docker Compose Setup

Add Docker Compose so frontend and backend run together with one command.

### Recommended Files

- docker-compose.yml
- frontend/Dockerfile
- backend/Dockerfile
- .env (optional)

### docker-compose.yml (MVP)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: thumb-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: thumb-backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: sh -c "npm install && npm run dev"
```

### frontend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### backend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Run Commands

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

### Notes

- Keep API base URL in frontend env (example: `VITE_API_URL=http://localhost:3000`)
- For production, replace dev commands with build + start
- Add healthchecks later when backend endpoints are finalized
