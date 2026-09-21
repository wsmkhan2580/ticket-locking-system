import React, { useState } from "react";
import { Headset } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AgentNamePrompt({ onSubmit }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-gradient p-4">
      <Card className="w-full max-w-sm p-7 shadow-glass">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Headset className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-base font-semibold text-navy-900">Sign in as an agent</h1>
          <p className="mt-1 text-sm text-navy-900/60">
            This name is shown to other agents when you lock a ticket.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Agent Reyes"
            maxLength={40}
            className="w-full rounded-lg border border-navy-900/10 bg-white/70 px-3.5 py-2.5 text-sm text-navy-900 outline-none transition-colors duration-200 ease-premium placeholder:text-navy-900/30 focus:border-accent-600 focus:ring-2 focus:ring-accent-600/20"
          />
          <Button type="submit" disabled={!value.trim()}>
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
