require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const { expressCorsOptions, socketIoCorsOptions, allowedOrigins } = require("./src/config/cors");
const tickets = require("./src/data/tickets");
const lockManager = require("./src/lock/lockManager");
const registerSocketHandlers = require("./src/socket/socketHandlers");

const app = express();
app.use(cors(expressCorsOptions));
app.use(express.json());

// --- Plain HTTP routes -----------------------------------------------------
// These exist so the frontend can do an initial REST fetch of ticket data
// (fast, cacheable, simple) while lock STATE is exclusively synchronized in
// real time over Socket.IO. Locks are never exposed as a mutable REST
// endpoint — the only way to change lock state is through the socket
// events, which keeps a single, unambiguous code path for concurrency.

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/tickets", (req, res) => {
  const snapshot = lockManager.getSnapshot();
  const ticketsWithLockState = tickets.map((ticket) => ({
    ...ticket,
    lock: snapshot[ticket.id] || null,
  }));
  res.json(ticketsWithLockState);
});

// --- HTTP + Socket.IO server ------------------------------------------------

const server = http.createServer(app);

const io = new Server(server, {
  cors: socketIoCorsOptions,
});

io.on("connection", (socket) => {
  registerSocketHandlers(io, socket);
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Ticket locking server listening on port ${PORT}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);
});
