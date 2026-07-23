# CodeSync — End-to-End Development Plan
*A real-time collaborative code editor, inspired by codeshare.io*

---

## 1. Analysis of codeshare.io

**Core mechanic:** a user opens the site, gets an instantly-created editor with a unique URL (no signup), shares that URL, and anyone who opens it edits the same document in real time. Changes sync character-by-character across all open tabs.

**Feature surface:**
- Instant anonymous session creation — no login required to start sharing.
- Live multi-cursor editing in one document, syntax highlighting for ~100 languages.
- Shareable link as the only access control (anyone with the link can view/edit).
- Optional video chat alongside the editor for pair programming / interviews.
- Use cases the product markets around: technical interviews, remote pair programming, teaching/classrooms, troubleshooting.
- Paid tiers unlock things like private/password-protected rooms, code execution, longer session retention.

**UX weaknesses to improve on:** no persistent history (refresh loses context if session expires), no read-only/interview mode toggle, no per-user cursor identity (hard to tell who typed what), no code execution sandbox, no session ownership/access control beyond "whoever has the link," no offline resilience, limited chat, no dark/light theme parity, no file/multi-tab support (one file per room only).

---

## 2. What CodeSync Adds Beyond Codeshare

1. **Named, colored multi-cursors & presence avatars** — every participant sees who is typing where, with names/avatars, not just anonymous carets.
2. **Room roles** — host (full control), editor (can type), viewer (read-only) — settable per participant, so interviewers can lock candidates into edit-only mode or watch silently.
3. **Multi-file rooms** — a session can hold a small file tree (e.g. `index.js`, `styles.css`), not just one buffer, useful for interviews/teaching.
4. **Persistent history** — sessions and their content are saved to MongoDB, so a room survives server restarts and can be reopened later; optional "save as snippet" to a personal library for signed-in users.
5. **Full accounts system (sign up / log in)** — Google OAuth + email/password sign-up with verification, a real dashboard of past rooms, private rooms, and password-protected rooms. Anonymous "guest" access still works for quick one-off shares like codeshare.io, but a proper account is a first-class part of the product, not a bolt-on.
6. **In-browser code execution** — run JS/Python/Node snippets in a sandboxed worker and show output inline (a real gap in the free tier of codeshare.io).
7. **Built-in text chat + live video chat** — a persistent text chat panel plus real-time WebRTC video/audio calling inside the room, shipped as a core v1 feature (not deferred).
8. **Session expiry controls** — hosts choose auto-expiry (1 hour / 1 day / never, for logged-in users) instead of the ambiguous default.
9. **Offline-tolerant editing** — CRDT-based sync (Yjs) so local edits aren't lost on brief disconnects and reconnect merges cleanly instead of last-write-wins.
10. **Solid basic text editing** — beyond raw sync, the editor itself gets undo/redo history, find & replace, auto-indent/bracket-matching, line numbers, font-size/word-wrap controls, and standard keyboard shortcuts (Ctrl/Cmd+S to save, Ctrl/Cmd+F to find) — the fundamentals that make it feel like a real editor, not just a shared textbox.
11. **Polished, calmer UX** — command palette, autosave indicator, connection-status toast, light/dark themes, mobile-friendly read view — aimed directly at the "ease and comfort" goal.

---

## 3. Tech Stack (mirrors your existing `youtube-website` project conventions)

**Client** — React + Vite + TypeScript + Tailwind CSS, deployed on **Vercel**.
- Editor: Monaco Editor (VS Code's editor) or CodeMirror 6 — Monaco gives the most "comfortable, familiar" feel.
- Real-time sync: `Yjs` + `y-websocket` (CRDT) for conflict-free concurrent editing, layered on Socket.IO for presence/chat/signaling.
- State: Zustand (same pattern as your reference project's `store` folder).
- Video/audio: WebRTC via `simple-peer`, signaling over the existing Socket.IO connection.

**Server** — Node.js + Express + Socket.IO, deployed on **Render** (Render is required here, not Vercel, because Vercel's serverless functions cannot hold long-lived WebSocket connections — this is the same reason your reference app split client/server across Vercel/Render).
- `mongoose` for MongoDB Atlas.
- `passport` + `passport-google-oauth20` + `passport-local` for auth (reusing the pattern already in `server/src`).
- `jsonwebtoken` + `bcryptjs` for session tokens.
- `y-websocket`/`y-mongodb-provider` (or a custom persistence adapter) to persist CRDT docs to Mongo.
- Sandboxed execution: a locked-down child process / `vm2`-style isolate, or delegate to a hosted code-execution API (e.g. Judge0) to avoid running arbitrary code on the same box as the API — this is a security-sensitive piece worth its own review before build.
- `helmet`, `express-rate-limit`, `cors`, `morgan` for hardening (same as reference project).

**Database** — MongoDB Atlas, **a brand-new, separate cluster** (not reusing the `youtube-website` cluster) with database name `codesync_db`, so CodeSync's data, billing, and blast radius stay fully isolated from the reference project.

**Other services reused from the reference project's provider accounts, new credentials/scopes:**
- Google Cloud Console → new OAuth Client ID/Secret scoped to CodeSync's redirect URIs (don't reuse the youtube-website OAuth client).
- Cloudinary → optional, only if we let users attach avatars/screenshots; can reuse the same Cloudinary account with a new upload folder/preset.

---

## 4. Data Model (MongoDB collections)

- **User** — `_id, name, email, passwordHash?, googleId?, avatarUrl, createdAt`.
- **Room** — `_id, slug (shareable code), ownerId?, title, files: [{name, language}], visibility (public-link | password | private), passwordHash?, expiresAt?, createdAt, lastActiveAt`.
- **Participant (ephemeral, in-memory or Redis-like via Mongo TTL)** — `roomId, userId?, guestName, color, role (host|editor|viewer), socketId, joinedAt`.
- **Snippet (saved library, signed-in users only)** — `_id, ownerId, roomId, content snapshot, savedAt`.
- **ChatMessage** — `roomId, senderName, senderId?, text, createdAt` (TTL-indexed to expire with the room).
- CRDT document state itself lives in a `YDoc` collection/binary blob keyed by `roomId`.

---

## 5. Real-Time Architecture

1. Client opens a room → connects Socket.IO to the Render backend, joins a room namespace `room:{slug}`.
2. Yjs document updates are broadcast peer-to-peer through the socket connection (y-websocket protocol) and persisted incrementally to Mongo so a server restart doesn't lose state.
3. Presence (cursors, names, colors) is a separate lightweight Socket.IO event stream, not part of the CRDT doc.
4. Video/audio uses WebRTC directly between browsers; Socket.IO is only used to exchange SDP/ICE signaling.
5. Code execution requests go over a normal REST call to the backend, which proxies to the sandboxed runner and streams stdout/stderr back over the socket.

---

## 6. Key REST Endpoints

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/google`, `GET /api/auth/google/callback`, `GET /api/auth/me`
`POST /api/rooms` (create room, works for guests too), `GET /api/rooms/:slug`, `PATCH /api/rooms/:slug` (owner settings: expiry, password, visibility)
`GET /api/rooms/:slug/history` (past snapshots, signed-in owner only)
`POST /api/rooms/:slug/execute` (run code, rate-limited)
`GET /api/snippets`, `POST /api/snippets`, `DELETE /api/snippets/:id`
`GET /health` (Render health check, matching the reference project's convention)

---

## 7. Deployment Plan

**Frontend → Vercel**
- New Vercel project pointed at `codesync/client`.
- Env vars: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_GOOGLE_CLIENT_ID`.
- Reuse the `vercel.json` pattern already present in the reference client.

**Backend → Render**
- New Render Web Service, `rootDir: server`, `buildCommand: npm install`, `startCommand: node src/index.js`, `healthCheckPath: /health` — same `render.yaml` shape as the reference project.
- Env vars set in Render dashboard (not committed): `MONGODB_URI` (new `codesync_db` database), `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET` (new OAuth client), `CLIENT_URL`, `CODE_EXEC_PROVIDER_KEY` (if using a hosted sandbox like Judge0), `CLOUDINARY_*` (optional, reused account/new preset).
- Because Socket.IO needs sticky sessions if you ever scale to >1 instance, note that for Render horizontal scaling later we'd add Redis (`socket.io-redis-adapter`) — not needed at single-instance launch.

**Database → MongoDB Atlas**
- New, separate Atlas cluster (free/shared tier to start) dedicated to CodeSync, database name `codesync_db`. Fully isolated from the `youtube-website` cluster — its own connection string, its own network access list.

**CI** — mirror the existing `.github/workflows/ci.yml` pattern: lint + build + (add) test on push, deploy previews via Vercel's native Git integration, and a Render deploy hook triggered on `main`.

---

## 8. Security & Comfort Considerations

- Rate-limit room creation and code execution to prevent abuse of the sandbox.
- Sandbox code execution fully isolated from the API process (separate container/VM or third-party runner) — arbitrary code execution is the highest-risk feature here.
- Password-protected rooms hash the password (bcrypt) and never send it back to the client.
- Guest identities are ephemeral and never trusted for authorization — only JWT-authenticated users can own/manage rooms.
- Autosave + reconnect banners, optimistic UI, and low-latency cursors are the main levers for the "ease and comfort" goal — these get dedicated UX passes, not just backend correctness.

---

## 9. Build Phases

1. **Foundation** — repo scaffold (client/server, same layout as `youtube-website`), new dedicated Mongo Atlas cluster + `codesync_db` setup, health check, CI skeleton, deploy empty app to Vercel + Render to validate the pipeline end-to-end early.
2. **Auth & accounts** — sign-up/log-in (email+password and Google OAuth), email verification, password reset, JWT sessions, user dashboard shell. This lands early since it's a core flow, not an afterthought.
3. **Core editor** — room creation (guest + signed-in), Monaco + Yjs sync, shareable links, basic presence cursors, and the "basic editing" fundamentals: undo/redo, find & replace, auto-indent, line numbers, keyboard shortcuts.
4. **Chat & video** — text chat panel, WebRTC video/audio calling with Socket.IO signaling, shipped as core v1 functionality.
5. **Roles, access control & persistence** — host/editor/viewer roles, password-protected & private rooms, expiry settings, saved snippet library, room history tied to accounts.
6. **Code execution sandbox** — pick provider (self-hosted isolate vs. Judge0-style API), wire up run/output UI.
7. **Polish pass** — themes, command palette, connection-status UX, mobile layout, empty/error states.
8. **Hardening & launch** — rate limiting, load test the Socket.IO layer, security review of auth + the execution sandbox, final deploy.

---

## 10. Open Decisions for You

- Confirmed: separate, dedicated MongoDB Atlas cluster for CodeSync (`codesync_db`), isolated from the `youtube-website` cluster.
- Confirmed: sign-up/log-in is a core v1 flow, and live video chat ships in v1 (not deferred).
- Still open — code execution: self-hosted sandbox (more control, more security work) vs. a hosted API like Judge0/Piston (faster to ship, small recurring cost)?
- Project/folder name — going with `codesync` for now; rename anytime before we start building.

