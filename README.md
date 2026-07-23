<div align="center">

# ⚡ CodeSync

**Share code in real-time, without the friction.**

A production-deployed, real-time collaborative code editor with live cursors, chat,
peer-to-peer video calling, and room-based access control — built for interviews,
pair programming, and teaching. No install, no setup, just a link.

[**Live App**](https://codesync-seven.vercel.app) · [**API Health**](https://codesync-7qib.onrender.com/health) · [Report a bug](https://github.com/Charan-place/codesync/issues)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=flat&logo=socket.io&logoColor=white)
![Yjs](https://img.shields.io/badge/Yjs-CRDT_Sync-4B5563?style=flat)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=flat&logo=webrtc&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=flat&logo=render&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
[![CI](https://github.com/Charan-place/codesync/actions/workflows/ci.yml/badge.svg)](https://github.com/Charan-place/codesync/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Charan-place/codesync/actions/workflows/codeql.yml/badge.svg)](https://github.com/Charan-place/codesync/actions/workflows/codeql.yml)

</div>

---

## What is this?

CodeSync is a full-stack, real-time collaborative code editor in the spirit of
[codeshare.io](https://codeshare.io) — rebuilt from the ground up with a heavier
feature set and a modern engineering approach: conflict-free collaborative editing
via CRDTs, first-class accounts, room-level access control, in-browser code
execution, and built-in peer-to-peer video calling — all shipped as a real,
deployed, end-to-end product rather than a local demo.

It's built to answer one question well: *how do two or more people look at, edit,
and talk through the same code at the same time, with zero setup on either side?*

## ✨ Features

| | |
|---|---|
| 🔄 **Real-time collaborative editing** | Every keystroke syncs instantly across every connected client using [Yjs](https://yjs.dev) CRDTs — no merge conflicts, no "someone else is editing" locks, no lost keystrokes, even on flaky connections. |
| 🎥 **Built-in video calling** | Peer-to-peer WebRTC video/audio, signaled over the same Socket.IO connection as the editor. No third-party embed, no extra tab. |
| 💬 **Live chat & presence** | See exactly who's in the room, their role, and talk it through without leaving the page. |
| 🔐 **Full authentication** | Email/password and Google OAuth 2.0, JWT-based sessions, persisted rooms tied to an account. |
| 🧑‍🤝‍🧑 **Room roles & access control** | Host / editor / viewer roles per participant, host-controlled permissions, optional password-protected rooms, and auto-expiring public sessions. |
| ▶️ **In-browser code execution** | Run JavaScript directly from the editor in a sandboxed, timeout-guarded environment — no local runtime required. |
| 🌐 **Multi-language editor** | Monaco-powered editing with syntax highlighting across JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more. |
| 🎨 **Polished, animated UI** | A hand-built design system (not a component library) with `framer-motion` micro-interactions, toast notifications, and a native-feeling interface end to end. |

## 🖥️ Live demo

| | |
|---|---|
| **App** | https://codesync-seven.vercel.app |
| **API** | https://codesync-7qib.onrender.com |

> Running on free-tier infrastructure — the backend spins down after inactivity, so
> the very first request after a while can take up to ~50s to wake up. Everything
> after that is instant.

## 🏗️ Architecture

```
┌──────────────────────┐         WebSocket (Socket.IO)        ┌───────────────────────┐
│                       │ ◄──────────────────────────────────► │                        │
│   React + Vite        │                                       │   Node + Express       │
│   Monaco Editor        │         REST (Axios, JWT auth)        │   Socket.IO server     │
│   Yjs (CRDT client)    │ ◄──────────────────────────────────► │   Passport (JWT/OAuth) │
│   simple-peer (WebRTC) │                                       │   Yjs (server doc)     │
│                       │         WebRTC signal relay            │   Sandboxed JS exec    │
│   Deployed → Vercel    │ ◄──────────────────────────────────► │   Deployed → Render    │
└──────────────────────┘                                       └───────────┬───────────┘
                                                                             │ Mongoose
                                                                             ▼
                                                                   ┌──────────────────┐
                                                                   │  MongoDB Atlas    │
                                                                   │  (codesync_db)    │
                                                                   └──────────────────┘
```

The editor's document state is a shared `Y.Doc` (Yjs): the server holds the
authoritative in-memory copy per active room, debounce-persists it to MongoDB, and
every client applies/broadcasts binary CRDT updates over the same socket used for
presence, chat, and WebRTC signaling — one connection, one source of truth, no
polling.

## 🧰 Tech stack

**Client** — React 19 · TypeScript · Vite · Tailwind CSS v4 · Monaco Editor ·
Yjs · Socket.IO client · simple-peer (WebRTC) · Zustand · React Router · Framer Motion · react-hot-toast

**Server** — Node.js · Express · TypeScript · Socket.IO · Mongoose (MongoDB) ·
Passport.js (JWT + Google OAuth 2.0) · bcrypt · Yjs (server-side CRDT authority)

**Infrastructure** — MongoDB Atlas · Render (WebSocket-capable backend) · Vercel
(SPA frontend, edge CDN) · Google Cloud Console (OAuth)

## 📂 Project structure

```
codesync/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── pages/          # Home, Login, Signup, Dashboard, Room, AuthCallback
│       ├── components/     # ChatPanel, VideoChat, ParticipantsBar, ui/*
│       ├── hooks/          # useRoomSocket, useVideoCall
│       ├── store/          # Zustand auth store
│       ├── api/            # Axios client + endpoint wrappers
│       └── utils/          # Custom Yjs ↔ Monaco binding
├── server/                 # Express + Socket.IO backend
│   └── src/
│       ├── controllers/    # auth, room, snippet, execute
│       ├── models/         # User, Room, ChatMessage, Snippet (Mongoose)
│       ├── sockets/        # Real-time room/doc/chat/WebRTC signaling
│       ├── services/       # Sandboxed code execution
│       ├── config/         # env, db, passport
│       └── middleware/     # JWT auth guards
└── PLAN.md                 # Original product/architecture plan
```

## 🚀 Local development

### 1. Server

```bash
cd server
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, SESSION_SECRET, etc.
npm install
npm run dev             # http://localhost:5000
```

### 2. Client

```bash
cd client
cp .env.example .env    # VITE_API_URL / VITE_SOCKET_URL default to localhost:5000
npm install
npm run dev              # http://localhost:5173
```

Open two browser windows on the same room URL to see live collaborative editing,
presence, chat, and video calling in action.

### Environment variables

<details>
<summary><code>server/.env</code></summary>

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on |
| `NODE_ENV` | `development` \| `production` |
| `SERVER_URL` / `CLIENT_URL` | Used for OAuth redirects and CORS |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `SESSION_SECRET` | Express session secret (OAuth handshake) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth 2.0 credentials |
| `DEFAULT_ROOM_TTL_HOURS` | Auto-expiry for anonymous/public rooms |
| `CODE_EXEC_TIMEOUT_MS` | Sandboxed execution timeout |

</details>

<details>
<summary><code>client/.env</code></summary>

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Backend Socket.IO URL |

</details>

## ☁️ Deployment

| Layer | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Static SPA build, `client/vercel.json` handles client-side routing rewrites |
| Backend | **Render** | Persistent WebSocket connections required — this ruled out serverless (Vercel Functions can't hold a live Socket.IO connection), `server/render.yaml` mirrors the deployed config |
| Database | **MongoDB Atlas** | Dedicated database (`codesync_db`), TTL index for auto-expiring anonymous rooms |
| Auth | **Google Cloud Console** | Dedicated OAuth 2.0 client, production + local redirect URIs configured |

## ✅ Continuous Integration

Every push and pull request against `main`/`develop` runs through
[`ci.yml`](.github/workflows/ci.yml) — entirely on GitHub's free Actions tier:

| Check | What it catches |
|---|---|
| `deno lint` | Fast whole-repo static analysis (unused code, `any` usage, unsafe patterns) |
| `oxlint` (client + server) | Framework-aware linting — React hooks rules, etc. |
| `tsc --noEmit` (server) | Server type errors before they ship |
| `tsc -b && vite build` (client) | The exact production build Vercel runs — a PR can't merge with a broken build |
| `npm run build` (server) | Confirms the server compiles to `dist/` the way Render's build step expects |
| `npm audit` | Dependency vulnerability report (informational, doesn't block merge) |
| [CodeQL](.github/workflows/codeql.yml) | GitHub's native security scanner — injection, unsafe regex, hardcoded secrets, etc. |
| [Dependabot](.github/dependabot.yml) | Weekly automated PRs for outdated/vulnerable dependencies, run through the same checks above |

To actually enforce these on `main`, turn on **Settings → Branches → Branch
protection rule** for `main` and require the `CI` and `CodeQL` status checks
(plus, optionally, at least one review) before a PR can merge.

## 🧭 Roadmap / known limitations

Being upfront about where this stands today:

- **Code execution is JavaScript-only** right now, running in a timeout-guarded
  Node `vm` context — good for demos and interviews, not yet a hardened
  multi-language sandbox. Wiring in Judge0/Piston for the other languages already
  supported in the editor is the next step.
- **Remote cursor *position* highlighting** isn't rendered inline yet — presence
  (who's here, their role and color) is fully tracked and shown live, but seeing
  exactly where someone else's caret is inside the editor is on the roadmap.
- **Socket.IO state is in-memory per server process** — correct and fast for a
  single instance, but horizontal scaling would need a Redis adapter.
- **WebRTC uses a public TURN relay** for NAT traversal — solid for demos and
  personal use; a production-scale deployment would swap in dedicated TURN
  infrastructure.

## 📄 License

MIT — see [`LICENSE`](./LICENSE).

---

<div align="center">
<sub>Built solo, end to end: architecture, real-time sync engine, auth, deployment infrastructure, and UI.</sub>
</div>
