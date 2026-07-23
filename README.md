# CodeSync

A real-time collaborative code editor, inspired by codeshare.io — with accounts,
room roles, persistent rooms, in-editor code execution, text chat and live video
calling. See `PLAN.md` for the full product/architecture plan.

## Stack

- **Client**: React + Vite + TypeScript + Tailwind CSS, Monaco Editor, Yjs (CRDT sync),
  Socket.IO client, simple-peer (WebRTC). Deploys to **Vercel**.
- **Server**: Node.js + Express + TypeScript + Socket.IO, Mongoose (MongoDB), Passport
  (JWT + Google OAuth), a sandboxed JS execution endpoint. Deploys to **Render**
  (required for WebSockets — Vercel serverless can't hold persistent socket connections).
- **Database**: MongoDB Atlas, dedicated cluster, database name `codesync_db`.

## Local development

### 1. Server

```
cd server
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, SESSION_SECRET, etc.
npm install
npm run dev             # http://localhost:5000
```

### 2. Client

```
cd client
cp .env.example .env    # VITE_API_URL / VITE_SOCKET_URL default to localhost:5000
npm install
npm run dev              # http://localhost:5173
```

Open two browser windows on the same room URL to see live collaborative editing,
presence, chat, and video calling in action.

## Required accounts / credentials (all new, not reused from other projects)

- **MongoDB Atlas** — new, dedicated cluster. Create database user + connection string,
  put it in `server/.env` as `MONGODB_URI` (database name `codesync_db`).
- **Google Cloud Console** — new OAuth 2.0 Client ID (Web application). Authorized
  redirect URI: `<SERVER_URL>/api/auth/google/callback`. Put client ID/secret in
  `server/.env`.
- **JWT_SECRET / SESSION_SECRET** — generate with `openssl rand -hex 32`.

## Deployment

### Backend → Render
- New Web Service, root directory `server`.
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`
- Set all secrets from `server/.env.example` in the Render dashboard (never commit `.env`).
- `render.yaml` in `server/` mirrors this configuration for Render's Blueprint deploys.

### Frontend → Vercel
- New Vercel project, root directory `client`.
- Framework preset: Vite.
- Env vars: `VITE_API_URL` and `VITE_SOCKET_URL` pointing at the deployed Render URL.
- `client/vercel.json` adds the SPA rewrite rule needed for client-side routing.

## Known limitations (MVP scope, flagged for hardening before real production traffic)

- Code execution only supports JavaScript today, run inside a Node `vm` context with a
  timeout — adequate for demos, not a substitute for a real container sandbox (see
  PLAN.md's open decision on Judge0/Piston) before allowing high-volume untrusted use.
- Remote cursor *position* highlighting inside the editor isn't wired up yet — presence
  (who's in the room, their color/role) is tracked and shown in the sidebar, but the
  Yjs↔Monaco binding here is a minimal custom one (not y-monaco, which broke under this
  project's bundler) and doesn't yet render other users' carets inline.
- Socket.IO state is in-memory per server process — fine for a single Render instance;
  scaling to multiple instances needs a Redis adapter (noted in PLAN.md).
- Google OAuth requires real credentials to be configured before that login path works;
  email/password sign-up works standalone.
# codesync
