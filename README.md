## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| 🎨 Frontend | https://frontend-kappa-sage-2ja9plfl2x.vercel.app |
| ⚙️ Backend | https://ticket-locking-system.onrender.com |



# Real-Time Ticket Locking System

A real-time ticket-locking feature for a customer-support dashboard. When one
agent opens a ticket, every other connected agent sees it become locked
instantly — no page refresh, no polling. If the locking agent disconnects
(closes the tab, loses network, crashes), the lock is released automatically
within moments and the ticket becomes available again for everyone.

This repo contains two independent apps:

```
realtime-ticket-locking/
├── backend/    Node.js + Express + Socket.IO server (in-memory locks)
└── frontend/   React + Vite + Tailwind + shadcn-style UI + Socket.IO client
```

---

## 1. Features

- **Real-time lock broadcasting** — lock/unlock state changes propagate to
  every connected client immediately via Socket.IO.
- **Server-authoritative concurrency** — the backend is the single source of
  truth for lock ownership. The frontend never decides on its own that a
  ticket is available; it only reflects what the server confirms.
- **Auto-unlock on disconnect** — `socket.on("disconnect")` releases every
  lock held by that socket, so a crashed tab or dropped connection can never
  leave a ticket permanently stuck.
- **In-memory only** — locks live in a `Map`/`Set` inside the Node process.
  They are never written to a database, by design (see [Known
  limitations](#8-known-limitations)).
- **Ownership enforcement** — only the agent holding a lock can release it;
  everyone else's unlock attempt is rejected by the server.
- **Snapshot on connect** — a newly connected/reconnected client immediately
  receives the full current lock table, so its UI is correct without waiting
  for the next event.
- **Premium, minimal UI** — glassmorphism cards, a deliberate navy/blue/green/red
  color system, Lucide vector icons (no emojis), Inter typography, and
  200ms ease-in-out micro-animations.
- **Fully responsive** — mobile, tablet, and desktop layouts via a
  Tailwind CSS grid.
- **Toast notifications** (optional enhancement) — non-blocking feedback when
  a lock/unlock action succeeds, fails, or happens because of a teammate.

---

## 2. Tech stack

| Layer      | Technology                                             |
|------------|---------------------------------------------------------|
| Backend    | Node.js, Express.js, Socket.IO, in-memory `Map`/`Set`   |
| Frontend   | React 18, Vite, Tailwind CSS, shadcn-style components   |
| Real-time  | Socket.IO (WebSocket with polling fallback)             |
| Icons      | Lucide React (vector icons only, no emojis)             |
| Deployment | Backend → Render, Frontend → Vercel/Netlify             |

No database, ORM, or state-management library was introduced — the spec
explicitly calls for in-memory locking and asks that no unnecessary
technology be added.

---

## 3. Architecture

```
┌─────────────────────┐        WebSocket (Socket.IO)        ┌──────────────────────┐
│   Agent A (browser)  │ ───────────────────────────────────▶│                      │
│  React + Socket.IO   │◀─────────────────────────────────── │   Express + Socket.IO │
│       client          │        broadcast lock/unlock         │        server         │
└─────────────────────┘                                       │                      │
                                                               │  ┌────────────────┐  │
┌─────────────────────┐        WebSocket (Socket.IO)          │  │  LockManager   │  │
│   Agent B (browser)  │ ───────────────────────────────────▶ │  │ Map<ticket,    │  │
│  React + Socket.IO   │◀───────────────────────────────────  │  │  {agentId,...}>│  │
│       client          │        broadcast lock/unlock         │  └────────────────┘  │
└─────────────────────┘                                       └──────────────────────┘
```

### Backend structure

```
backend/
├── server.js                    Express app + HTTP server + Socket.IO bootstrap
├── src/
│   ├── config/cors.js           Shared CORS allow-list (env-driven)
│   ├── data/tickets.js          Static in-memory ticket seed data
│   ├── lock/lockManager.js      The lock table (Map) + all mutation logic
│   └── socket/socketHandlers.js Socket.IO event wiring (thin — delegates
│                                  every ownership decision to lockManager)
```

`lockManager.js` is the only file that touches the lock `Map`. Every other
module asks it questions ("can this agent lock this ticket?") instead of
mutating shared state directly. This is what keeps concurrency correct: there
is exactly one code path that can create or remove a lock.

### Frontend structure

```
frontend/src/
├── App.jsx                      Top-level composition + agent identity
├── lib/
│   ├── socket.js                Shared Socket.IO client instance
│   └── utils.js                 cn() class merge helper, time formatting
├── hooks/
│   ├── useTicketSocket.js       All socket event subscriptions + actions
│   └── useToasts.js             Optional toast queue
├── components/
│   ├── DashboardHeader.jsx      Branding, connection status, presence count
│   ├── AgentNamePrompt.jsx      Lightweight "who is this agent" onboarding
│   ├── TicketDashboard.jsx      Responsive grid of TicketCard
│   ├── TicketCard.jsx           Ticket info + lock indicator + lock/unlock action
│   ├── ToastStack.jsx           Optional toast rendering
│   └── ui/                      shadcn-style Button, Badge, Card primitives
```

---

## 4. How ticket locking works

1. **Agent identifies itself.** On first load, an agent enters a display
   name (stored for the browser tab session only). This name is sent to the
   server via `agent:identify` purely for display — it has no bearing on
   lock ownership.
2. **Connecting.** When a socket connects, the server immediately sends
   `locks:snapshot`, a plain object of every currently-locked ticket. This
   means a fresh page load or a reconnect always renders correct state.
3. **Locking.** The client emits `lock_ticket` with a `ticketId`. The server:
   - Rejects it if the ticket doesn't exist, or is already locked (returns a
     `lock_error` to the requester only — no broadcast, because nothing
     changed for anyone else).
   - Otherwise stores `{ agentId: socket.id, agentName, lockedAt }` in the
     lock `Map`, keyed by `ticketId`, and broadcasts `ticket_locked` to
     **every** connected client (including the requester), so state is
     identical everywhere.
4. **Unlocking.** The client emits `unlock_ticket`. The server checks that
   `socket.id` matches the lock's `agentId` before removing it. If another
   agent tries to unlock a ticket they don't own, the server rejects it with
   `lock_error` (`NOT_OWNER`) and the lock stays exactly as it was.
5. **Disconnecting.** `socket.on("disconnect")` looks up every ticket that
   socket was holding (via a reverse index kept in `lockManager`), deletes
   those locks, and broadcasts `ticket_unlocked` for each one with
   `reason: "AGENT_DISCONNECTED"`. Every other connected agent sees the
   ticket become available immediately.

The frontend never independently decides a ticket is unlocked — it only
updates state in response to `locks:snapshot`, `ticket_locked`, or
`ticket_unlocked` events coming from the server.

---

## 5. Socket.IO event reference

### Client → Server

| Event             | Payload                | Purpose                                   |
|-------------------|-------------------------|--------------------------------------------|
| `agent:identify`  | `{ name }`              | Associate a display name with this socket |
| `lock_ticket`     | `{ ticketId }`          | Request a lock on a ticket                |
| `unlock_ticket`   | `{ ticketId }`          | Release a lock this socket owns           |

Both `lock_ticket` and `unlock_ticket` accept an optional acknowledgement
callback and respond with `{ success, reason?, lock? }`.

### Server → Client

| Event              | Payload                                            | Sent to             |
|--------------------|-----------------------------------------------------|----------------------|
| `locks:snapshot`   | `{ [ticketId]: { agentId, agentName, lockedAt } }`  | The connecting socket only |
| `ticket_locked`    | `{ ticketId, agentId, agentName, lockedAt }`        | Broadcast (everyone) |
| `ticket_unlocked`  | `{ ticketId, reason? }`                             | Broadcast (everyone) |
| `lock_error`       | `{ ticketId, reason, lockedBy? }`                   | The requester only  |
| `presence:update`  | `{ connectedAgents }`                               | Broadcast (everyone) |

`lock_error` reasons: `ALREADY_LOCKED`, `NOT_LOCKED`, `NOT_OWNER`,
`TICKET_NOT_FOUND`, `INVALID_TICKET_ID`.

---

## 6. Concurrency & edge cases handled

| Scenario | Behavior |
|---|---|
| Two agents lock the same ticket at nearly the same time | Node's single-threaded event loop processes `lock_ticket` events one at a time; whichever arrives first wins, the second is rejected with `ALREADY_LOCKED` and told who holds it. |
| Agent disconnects while holding a lock | `disconnect` handler releases every lock that socket held and broadcasts the unlock. |
| Unlocking a ticket that isn't locked | Rejected with `NOT_LOCKED`; no broadcast (nothing changed). |
| Agent tries to unlock a ticket they don't own | Rejected with `NOT_OWNER`; the lock is untouched. |
| Socket reconnects | New `socket.id` receives a fresh `locks:snapshot` on connect, so state is always correct after a reconnect — any locks the old socket held were already released by the earlier disconnect event. |
| One agent holds multiple tickets | `lockManager` tracks a `Set` of ticket IDs per agent, so all of them are released together on disconnect. |
| Many agents connected simultaneously | `presence:update` broadcasts the live connected-agent count; every state change is broadcast to all sockets via `io.emit`, not just a subset. |
| Stale/ghost lock state | Because locks live only in memory tied to an active socket connection, a lock cannot outlive its socket — there is no persisted state that could go stale after a server restart either, since the table is rebuilt empty on boot. |

---

## 7. Local setup

### Prerequisites

- Node.js 18+
- Two terminal windows (one for backend, one for frontend)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev        # or: npm start
```

The server starts on `http://localhost:4000` by default (`PORT` in `.env`).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app starts on `http://localhost:5173` (Vite default).

### Try it locally

1. Open `http://localhost:5173` in one browser window — sign in as "Agent A".
2. Open the same URL in a **second window or incognito tab** — sign in as
   "Agent B".
3. Lock a ticket as Agent A → watch it turn red/locked in Agent B's window
   instantly.
4. Close Agent A's tab (or stop its dev server tab) → watch Agent B's window
   show the ticket become available again within seconds, with no refresh.

---

## 8. Environment variables

### `backend/.env`

| Variable         | Description                                                  | Example                                      |
|-------------------|---------------------------------------------------------------|-----------------------------------------------|
| `PORT`            | Port the Express/Socket.IO server listens on                 | `4000`                                        |
| `CLIENT_ORIGINS`  | Comma-separated list of allowed CORS origins                  | `https://your-app.vercel.app,http://localhost:5173` |

### `frontend/.env`

| Variable            | Description                                             | Example                          |
|----------------------|-----------------------------------------------------------|-----------------------------------|
| `VITE_SERVER_URL`   | URL of the backend (used for REST + Socket.IO connection) | `https://your-backend.onrender.com` |

---

## 9. Deployment

### Backend → Render

1. Push this repo to GitHub.
2. In Render, create a **Web Service** pointed at the `backend/` directory.
3. Build command: `npm install`. Start command: `npm start`.
4. Set environment variables in Render's dashboard:
   - `CLIENT_ORIGINS` = your deployed frontend URL(s), comma-separated.
   - `PORT` is provided automatically by Render — the app already falls
     back to `process.env.PORT`.
5. Deploy. Note the resulting URL, e.g. `https://ticket-locking-api.onrender.com`.

### Frontend → Vercel or Netlify

1. Import the repo, set the project root to `frontend/`.
2. Build command: `npm run build`. Output directory: `dist`.
3. Set the environment variable `VITE_SERVER_URL` to your Render backend URL
   from the step above.
4. Deploy.
5. Go back to Render and make sure `CLIENT_ORIGINS` includes this exact
   deployed frontend URL, then redeploy the backend if you changed it.

### Verifying production WebSocket + CORS

- Open the deployed frontend in two separate browser windows.
- Confirm the header shows **"Live"** (green) rather than "Reconnecting…".
- Lock a ticket in one window and confirm the other updates instantly.
- If the connection fails, check the browser console for a CORS error and
  confirm `CLIENT_ORIGINS` on the backend exactly matches the frontend's
  origin (including `https://` and no trailing slash).

**Deployed links** *(fill in after deploying)*:

- Frontend: `<add your Vercel/Netlify URL here>`
- Backend: `<add your Render URL here>`

---

## 10. Known limitations

- **Locks do not survive a server restart.** This is intentional per the
  spec (in-memory only, never persisted) — a redeploy or crash of the
  backend clears all locks, which is the correct behavior for a lock that's
  meant to represent "someone has this open right now."
- **Single-instance only.** The lock `Map` lives in one Node process's
  memory. Running multiple backend instances behind a load balancer without
  sticky sessions (or a shared adapter like `socket.io-redis`) would let two
  instances each think they're the source of truth. Out of scope per the
  spec, which explicitly asks for a simple in-memory structure rather than
  additional infrastructure.
- **Agent identity is self-reported.** An agent's display name is whatever
  they type in — there's no authentication layer, which matches the scope
  of this feature (a locking mechanism, not an auth system). Lock
  *ownership*, however, is never self-reported: it's tied to the
  server-assigned `socket.id`, so a client cannot spoof ownership of a lock
  by claiming a different name.
- **No ticket CRUD.** Ticket data is static seed data to keep focus on the
  locking mechanism itself, per the spec's emphasis on real-time
  architecture over "basic CRUD."
- **Render free-tier cold starts.** If deployed on Render's free tier, the
  backend may sleep after inactivity, causing the first Socket.IO connection
  to take a few extra seconds.

---

## 11. Demo video

See the dual-window demo video (linked separately / included alongside this
submission) showing Agent A and Agent B locking, unlocking, and
auto-unlocking a ticket in real time via disconnect — without any page
refresh, per the acceptance criteria in the project brief.
