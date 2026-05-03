import { useMemo, useState } from "react";
import { LogEvent } from "../api";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { StatusDot } from "../components/ui/StatusDot";
import { useEsp32 } from "../hooks/useEsp32";
import { PageHeader } from "./PageHeader";

const FILTERS: (LogEvent["severity"] | "all")[] = ["all", "danger", "warn", "info", "ok"];

export default function SystemLogs() {
  const { logs } = useEsp32();
  const [filter, setFilter] = useState<LogEvent["severity"] | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return logs.filter((a) => {
      if (filter !== "all" && a.severity !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          a.message.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filter, query]);

  return (
    <div>
      <PageHeader
        title="System Logs"
        subtitle="Unified event stream · ESP32 + AI services"
        endpoint="GET /api/v1/logs?limit=100"
      />

      <Panel
        title="Event stream"
        subtitle={`${filtered.length} of ${logs.length} events`}
        right={
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="filter messages…"
              className="h-7 w-48 rounded border border-zinc-800 bg-zinc-950 px-2 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none"
            />
            <div className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-950 p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={[
                    "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    filter === f
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "text-zinc-400 hover:bg-zinc-900",
                  ].join(" ")}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        }
      >
        <div className="overflow-hidden rounded border border-zinc-800 bg-black/40 font-mono text-[12px]">
          <div className="grid grid-cols-[80px_60px_120px_1fr] border-b border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <div>Time</div>
            <div>Level</div>
            <div>Source</div>
            <div>Message</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-zinc-500">no events match</div>
            ) : null}
            {filtered.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-[80px_60px_120px_1fr] items-center gap-2 border-b border-zinc-900 px-3 py-1.5 hover:bg-zinc-900/40"
              >
                <span className="text-zinc-500">
                  {new Date(a.ts * 1000).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
                <span>
                  <Pill severity={a.severity}>
                    <StatusDot
                      severity={a.severity}
                      pulse={a.severity === "danger"}
                      size="sm"
                    />
                    {a.severity.toUpperCase()}
                  </Pill>
                </span>
                <span className="truncate text-zinc-300">{a.source}</span>
                <span className="truncate text-zinc-100">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
