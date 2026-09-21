import { useCallback, useEffect, useRef, useState } from "react";
import { socket, SERVER_HTTP_URL } from "@/lib/socket";

/**
 * Owns all real-time state for the dashboard:
 *   - the ticket list (fetched once over REST)
 *   - the lock map (kept in sync purely via Socket.IO events — never via
 *     polling, and never trusted to be "whatever the frontend last set" —
 *     every lock/unlock the UI shows is either the initial snapshot from
 *     the server or a broadcast the server sent after mutating its own
 *     source of truth).
 *   - connection status, so the UI can show "Connecting..." accurately.
 *
 * agentName is the only piece of client-owned identity; ownership of a lock
 * is still enforced server-side by socket.id, so a client can't unlock
 * someone else's ticket just by claiming a name.
 */
export function useTicketSocket({ agentName, onEvent }) {
  const [tickets, setTickets] = useState([]);
  const [locks, setLocks] = useState({});
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [connectedAgents, setConnectedAgents] = useState(1);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Fetch ticket metadata once via REST. Lock state comes exclusively from
  // Socket.IO, so this initial payload's `lock` field is just a courtesy —
  // the "locks:snapshot" socket event below is what actually seeds state.
  useEffect(() => {
    let cancelled = false;
    setIsLoadingTickets(true);
    fetch(`${SERVER_HTTP_URL}/api/tickets`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTickets(data);
      })
      .catch(() => {
        onEventRef.current?.({
          tone: "danger",
          title: "Couldn't load tickets",
          description: "Check that the backend server is running.",
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTickets(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (agentName) {
      socket.emit("agent:identify", { name: agentName });
    }
  }, [agentName]);

  useEffect(() => {
    function handleConnect() {
      setIsConnected(true);
      if (agentName) socket.emit("agent:identify", { name: agentName });
    }
    function handleDisconnect() {
      setIsConnected(false);
    }
    function handleSnapshot(snapshot) {
      setLocks(snapshot || {});
    }
    function handleLocked({ ticketId, agentId, agentName: lockedByName, lockedAt }) {
      setLocks((prev) => ({ ...prev, [ticketId]: { agentId, agentName: lockedByName, lockedAt } }));
      if (agentId !== socket.id) {
        onEventRef.current?.({
          tone: "info",
          title: `Ticket ${ticketId} locked`,
          description: `${lockedByName} is now working on this ticket.`,
        });
      }
    }
    function handleUnlocked({ ticketId, reason }) {
      setLocks((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      if (reason === "AGENT_DISCONNECTED") {
        onEventRef.current?.({
          tone: "success",
          title: `Ticket ${ticketId} is available`,
          description: "The previous agent disconnected and the lock was released.",
        });
      }
    }
    function handleLockError({ ticketId, reason, lockedBy }) {
      const messages = {
        ALREADY_LOCKED: `Ticket ${ticketId} is already locked by ${lockedBy || "another agent"}.`,
        NOT_LOCKED: `Ticket ${ticketId} isn't locked, so there's nothing to release.`,
        NOT_OWNER: `Ticket ${ticketId} is locked by ${lockedBy || "another agent"} — only they can unlock it.`,
        TICKET_NOT_FOUND: `Ticket ${ticketId} doesn't exist.`,
        INVALID_TICKET_ID: "That request was missing a valid ticket ID.",
      };
      onEventRef.current?.({
        tone: "danger",
        title: "Action not allowed",
        description: messages[reason] || "The server rejected this action.",
      });
    }
    function handlePresence({ connectedAgents: count }) {
      setConnectedAgents(count);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("locks:snapshot", handleSnapshot);
    socket.on("ticket_locked", handleLocked);
    socket.on("ticket_unlocked", handleUnlocked);
    socket.on("lock_error", handleLockError);
    socket.on("presence:update", handlePresence);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("locks:snapshot", handleSnapshot);
      socket.off("ticket_locked", handleLocked);
      socket.off("ticket_unlocked", handleUnlocked);
      socket.off("lock_error", handleLockError);
      socket.off("presence:update", handlePresence);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentName]);

  const lockTicket = useCallback((ticketId) => {
    socket.emit("lock_ticket", { ticketId }, (res) => {
      if (!res?.success) return; // lock_error event already handled the UX
    });
  }, []);

  const unlockTicket = useCallback((ticketId) => {
    socket.emit("unlock_ticket", { ticketId }, (res) => {
      if (!res?.success) return;
    });
  }, []);

  return {
    tickets,
    locks,
    isConnected,
    isLoadingTickets,
    connectedAgents,
    myAgentId: socket.id,
    lockTicket,
    unlockTicket,
  };
}
