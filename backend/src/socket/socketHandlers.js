/**
 * Socket.IO event wiring.
 *
 * This module is intentionally thin: it validates input, delegates every
 * decision about lock ownership to lockManager (the single source of
 * truth), and broadcasts the result. No lock logic lives here.
 *
 * Events handled:
 *   - "agent:identify"  (agent tells the server its display name)
 *   - "lock_ticket"
 *   - "unlock_ticket"
 *   - "disconnect"
 *
 * Broadcast events emitted:
 *   - "locks:snapshot"     -> sent to a single newly-connected client
 *   - "ticket_locked"      -> broadcast to everyone
 *   - "ticket_unlocked"    -> broadcast to everyone
 *   - "lock_error"         -> sent back only to the requester
 *   - "presence:update"    -> broadcast connected-agent count (nice-to-have,
 *                             not required, but harmless and useful for UX)
 */

const lockManager = require("../lock/lockManager");
const tickets = require("../data/tickets");

// agentId -> agentName, so we can recover a friendly name on disconnect and
// avoid trusting the client to keep resending it correctly.
const agentDirectory = new Map();

function ticketExists(ticketId) {
  return tickets.some((t) => t.id === ticketId);
}

function registerSocketHandlers(io, socket) {
  // Every socket connection IS an agent session. We default to a
  // human-readable fallback name until the client identifies itself.
  const agentId = socket.id;
  agentDirectory.set(agentId, `Agent ${agentId.slice(0, 5)}`);

  // Send the newly-connected client the full current lock state so its UI
  // is correct immediately, without waiting for someone else to trigger an
  // event. This is what makes reconnects / fresh page loads show accurate
  // state instead of assuming everything is unlocked.
  socket.emit("locks:snapshot", lockManager.getSnapshot());

  broadcastPresence(io);

  socket.on("agent:identify", (payload = {}) => {
    const name = typeof payload.name === "string" && payload.name.trim()
      ? payload.name.trim().slice(0, 40)
      : agentDirectory.get(agentId);
    agentDirectory.set(agentId, name);
  });

  socket.on("lock_ticket", (payload = {}, ack) => {
    const { ticketId } = payload;

    if (typeof ticketId !== "string" || !ticketId) {
      return safeAck(ack, { success: false, reason: "INVALID_TICKET_ID" });
    }

    if (!ticketExists(ticketId)) {
      return safeAck(ack, { success: false, reason: "TICKET_NOT_FOUND" });
    }

    const agentName = agentDirectory.get(agentId) || "Unknown Agent";
    const result = lockManager.lockTicket(ticketId, agentId, agentName);

    if (!result.success) {
      // Reject only the requester — the ticket state hasn't changed for
      // anyone else, so there's nothing to broadcast.
      socket.emit("lock_error", {
        ticketId,
        reason: result.reason,
        lockedBy: result.lock?.agentName,
      });
      return safeAck(ack, { success: false, reason: result.reason, lock: result.lock });
    }

    // Source of truth changed -> tell EVERY connected client, including the
    // requester, so state stays perfectly consistent across all agents.
    io.emit("ticket_locked", {
      ticketId,
      agentId: result.lock.agentId,
      agentName: result.lock.agentName,
      lockedAt: result.lock.lockedAt,
    });

    safeAck(ack, { success: true, lock: result.lock });
  });

  socket.on("unlock_ticket", (payload = {}, ack) => {
    const { ticketId } = payload;

    if (typeof ticketId !== "string" || !ticketId) {
      return safeAck(ack, { success: false, reason: "INVALID_TICKET_ID" });
    }

    const result = lockManager.unlockTicket(ticketId, agentId);

    if (!result.success) {
      socket.emit("lock_error", {
        ticketId,
        reason: result.reason,
        lockedBy: result.lock?.agentName,
      });
      return safeAck(ack, { success: false, reason: result.reason });
    }

    io.emit("ticket_unlocked", { ticketId });
    safeAck(ack, { success: true });
  });

  socket.on("disconnect", () => {
    // Ghost-session cleanup: whatever this agent was holding gets released
    // immediately so no ticket is stuck "locked" by a socket that no longer
    // exists.
    const releasedTicketIds = lockManager.releaseAllLocksForAgent(agentId);
    agentDirectory.delete(agentId);

    for (const ticketId of releasedTicketIds) {
      io.emit("ticket_unlocked", { ticketId, reason: "AGENT_DISCONNECTED" });
    }

    broadcastPresence(io);
  });

  function broadcastPresence(ioRef) {
    ioRef.emit("presence:update", { connectedAgents: ioRef.engine.clientsCount });
  }
}

function safeAck(ack, payload) {
  if (typeof ack === "function") {
    ack(payload);
  }
}

module.exports = registerSocketHandlers;
