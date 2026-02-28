"use client";

import { useEffect, useState } from "react";
import type { SessionData } from "@/types";

export default function SessionSelector({
  onSelect,
  selectedId,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const [sessions, setSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(console.error);
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-400 shrink-0">Session:</label>
      <select
        value={selectedId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
      >
        <option value="">Select a session...</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title || formatDate(s.startedAt)}{" "}
            {s.status === "recording" ? "(LIVE)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
