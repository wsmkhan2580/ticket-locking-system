import React from "react";
import { Headset, Users, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader({ agentName, isConnected, connectedAgents, openTicketCount }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/40 bg-white/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Headset className="h-4.5 w-4.5" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-navy-900 sm:text-base">
              Support Desk
            </h1>
            <p className="text-xs text-navy-900/50">Live ticket queue · {openTicketCount} open</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-navy-900/5 px-3 py-1.5 text-xs font-medium text-navy-900/70">
            <Users className="h-3.5 w-3.5" />
            {connectedAgents} agent{connectedAgents === 1 ? "" : "s"} online
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-200 ease-premium",
              isConnected ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-700"
            )}
          >
            {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isConnected ? "Live" : "Reconnecting…"}
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-navy-900/10 bg-white/60 px-3 py-1.5 text-xs font-medium text-navy-900 sm:flex">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-[10px] font-semibold text-white">
              {agentName?.charAt(0)?.toUpperCase() || "?"}
            </span>
            {agentName}
          </div>
        </div>
      </div>
    </header>
  );
}
