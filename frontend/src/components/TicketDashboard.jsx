import React from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { TicketCard } from "@/components/TicketCard";

export function TicketDashboard({ tickets, locks, myAgentId, isLoading, onLock, onUnlock }) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-navy-900/50">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-sm">Loading tickets…</p>
      </div>
    );
  }

  if (!tickets.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-navy-900/50">
        <LockKeyhole className="h-6 w-6" />
        <p className="text-sm">No tickets in the queue.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => {
        const lock = locks[ticket.id];
        return (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            lock={lock}
            isOwnedByMe={Boolean(lock) && lock.agentId === myAgentId}
            onLock={onLock}
            onUnlock={onUnlock}
          />
        );
      })}
    </div>
  );
}
