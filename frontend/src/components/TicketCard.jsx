import React from "react";
import { Lock, LockOpen, User2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";

const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
const PRIORITY_VARIANT = {
  high: "priorityHigh",
  medium: "priorityMedium",
  low: "priorityLow",
};
const STATUS_LABEL = { open: "Open", in_progress: "In progress" };

export function TicketCard({ ticket, lock, isOwnedByMe, onLock, onUnlock }) {
  const isLocked = Boolean(lock);

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5 transition-all duration-200 ease-premium",
        "hover:shadow-glass",
        isLocked && !isOwnedByMe && "ring-1 ring-danger-600/20",
        isLocked && isOwnedByMe && "ring-1 ring-success-600/25"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-navy-900/50">{ticket.id}</span>
            <Badge variant={PRIORITY_VARIANT[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Badge>
            <Badge variant="neutral">{STATUS_LABEL[ticket.status] || ticket.status}</Badge>
          </div>
          <h3 className="mt-1.5 truncate text-sm font-semibold text-navy-900">{ticket.subject}</h3>
          <p className="mt-0.5 text-xs text-navy-900/60">{ticket.customerName}</p>
        </div>

        <LockIndicator isLocked={isLocked} isOwnedByMe={isOwnedByMe} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-navy-900/5 pt-3">
        <AgentIndicator lock={lock} isOwnedByMe={isOwnedByMe} />

        {isLocked ? (
          <Button
            variant={isOwnedByMe ? "outline" : "danger"}
            size="sm"
            disabled={!isOwnedByMe}
            onClick={() => onUnlock(ticket.id)}
            aria-label={isOwnedByMe ? `Unlock ${ticket.id}` : `${ticket.id} is locked by ${lock.agentName}`}
          >
            <LockOpen className="h-3.5 w-3.5" />
            {isOwnedByMe ? "Unlock" : "Locked"}
          </Button>
        ) : (
          <Button
            variant="success"
            size="sm"
            onClick={() => onLock(ticket.id)}
            aria-label={`Lock ${ticket.id}`}
          >
            <Lock className="h-3.5 w-3.5" />
            Lock ticket
          </Button>
        )}
      </div>
    </Card>
  );
}

function LockIndicator({ isLocked, isOwnedByMe }) {
  if (!isLocked) {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700 transition-colors duration-200 ease-premium"
        title="Available"
      >
        <LockOpen className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ease-premium",
        isOwnedByMe ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"
      )}
      title={isOwnedByMe ? "Locked by you" : "Locked"}
    >
      <Lock className="h-4 w-4" />
    </span>
  );
}

function AgentIndicator({ lock, isOwnedByMe }) {
  if (!lock) {
    return <span className="text-xs font-medium text-success-700">Available</span>;
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-xs">
      <User2 className="h-3.5 w-3.5 shrink-0 text-navy-900/40" />
      <span className={cn("truncate font-medium", isOwnedByMe ? "text-success-700" : "text-danger-700")}>
        {isOwnedByMe ? "Locked by you" : `Locked by ${lock.agentName}`}
      </span>
      <span className="hidden text-navy-900/40 sm:inline">· {formatRelativeTime(lock.lockedAt)}</span>
    </div>
  );
}
