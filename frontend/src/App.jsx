import React, { useCallback, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TicketDashboard } from "@/components/TicketDashboard";
import { AgentNamePrompt } from "@/components/AgentNamePrompt";
import { ToastStack } from "@/components/ToastStack";
import { useTicketSocket } from "@/hooks/useTicketSocket";
import { useToasts } from "@/hooks/useToasts";

const STORAGE_KEY = "ticket-locking:agent-name";

export default function App() {
  const [agentName, setAgentName] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const { toasts, push, dismiss } = useToasts();

  const handleEvent = useCallback((toast) => push(toast), [push]);

  const { tickets, locks, isConnected, isLoadingTickets, connectedAgents, myAgentId, lockTicket, unlockTicket } =
    useTicketSocket({ agentName, onEvent: handleEvent });

  if (!agentName) {
    return (
      <AgentNamePrompt
        onSubmit={(name) => {
          sessionStorage.setItem(STORAGE_KEY, name);
          setAgentName(name);
        }}
      />
    );
  }

  const openTicketCount = tickets.filter((t) => !locks[t.id]).length;

  return (
    <div className="min-h-screen bg-app-gradient">
      <DashboardHeader
        agentName={agentName}
        isConnected={isConnected}
        connectedAgents={connectedAgents}
        openTicketCount={openTicketCount}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <TicketDashboard
          tickets={tickets}
          locks={locks}
          myAgentId={myAgentId}
          isLoading={isLoadingTickets}
          onLock={lockTicket}
          onUnlock={unlockTicket}
        />
      </main>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
