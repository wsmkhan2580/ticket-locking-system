/**
 * LockManager
 * -----------
 * The single, authoritative, in-memory source of truth for ticket lock
 * ownership. Nothing here touches a database — locks live only as long as
 * the Node process is running, by design (per the spec: locks must NEVER be
 * persisted to MongoDB or any other database).
 *
 * Data structure:
 *   locks: Map<ticketId, { agentId, agentName, lockedAt }>
 *
 * We also keep a reverse index so that when a socket disconnects we can find
 * every ticket it was holding without scanning the whole Map on every
 * disconnect (fine at small scale either way, but this keeps intent clear
 * and stays O(locks held by that agent) instead of O(all tickets)).
 *
 *   agentTickets: Map<agentId, Set<ticketId>>
 *
 * All mutation happens through the methods below so that lock/unlock/
 * release-on-disconnect logic is defined in exactly one place.
 */

class LockManager {
  constructor() {
    /** @type {Map<string, {agentId: string, agentName: string, lockedAt: number}>} */
    this.locks = new Map();

    /** @type {Map<string, Set<string>>} */
    this.agentTickets = new Map();
  }

  /**
   * Returns the current lock entry for a ticket, or undefined if free.
   */
  getLock(ticketId) {
    return this.locks.get(ticketId);
  }

  /**
   * Attempt to lock a ticket for a given agent.
   *
   * Returns a result object rather than throwing, so callers (socket
   * handlers) can decide exactly what to emit back to the requester without
   * try/catch noise:
   *
   *   { success: true, lock }
   *   { success: false, reason: "ALREADY_LOCKED", lock }
   */
  lockTicket(ticketId, agentId, agentName) {
    const existing = this.locks.get(ticketId);

    // Already locked by someone else (or even by the same agent again from
    // a stale click) -> reject. The backend is the source of truth, so we
    // never trust the frontend's optimistic state here.
    if (existing) {
      return { success: false, reason: "ALREADY_LOCKED", lock: existing };
    }

    const lock = { agentId, agentName, lockedAt: Date.now() };
    this.locks.set(ticketId, lock);

    if (!this.agentTickets.has(agentId)) {
      this.agentTickets.set(agentId, new Set());
    }
    this.agentTickets.get(agentId).add(ticketId);

    return { success: true, lock };
  }

  /**
   * Attempt to unlock a ticket. Only the owning agent may unlock it.
   *
   *   { success: true }
   *   { success: false, reason: "NOT_LOCKED" }
   *   { success: false, reason: "NOT_OWNER", lock }
   */
  unlockTicket(ticketId, agentId) {
    const existing = this.locks.get(ticketId);

    if (!existing) {
      return { success: false, reason: "NOT_LOCKED" };
    }

    if (existing.agentId !== agentId) {
      return { success: false, reason: "NOT_OWNER", lock: existing };
    }

    this.locks.delete(ticketId);
    this.agentTickets.get(agentId)?.delete(ticketId);

    return { success: true };
  }

  /**
   * Releases every lock held by a given agent (used on disconnect, and could
   * also be reused for an explicit "log out" action). Returns the list of
   * ticketIds that were released so the caller can broadcast each one.
   */
  releaseAllLocksForAgent(agentId) {
    const ticketIds = Array.from(this.agentTickets.get(agentId) || []);

    for (const ticketId of ticketIds) {
      this.locks.delete(ticketId);
    }

    this.agentTickets.delete(agentId);

    return ticketIds;
  }

  /**
   * Returns a plain-object snapshot of all current locks, suitable for
   * sending to a newly-connected client so it can render correct state
   * immediately instead of waiting for the next event.
   *
   *   { [ticketId]: { agentId, agentName, lockedAt } }
   */
  getSnapshot() {
    return Object.fromEntries(this.locks.entries());
  }
}

// Exported as a singleton: the whole app should share exactly one lock
// table. If you ever needed multiple independent instances (e.g. in tests)
// import the class itself instead.
module.exports = new LockManager();
module.exports.LockManager = LockManager;
