import { AlertOctagon, ShieldCheck } from "lucide-react";
import { useEsp32 } from "../../hooks/useEsp32";
import { Panel } from "../ui/Panel";
import { Pill } from "../ui/Pill";
import { StatusDot } from "../ui/StatusDot";

const sevLabel = { ok: "OK", info: "INFO", warn: "WARN", danger: "CRIT" } as const;

export function SafetyAlerts() {
  const { logs } = useEsp32();
  const top = logs.slice(0, 10);
  const danger = logs.filter((a) => a.severity === "danger");

  return (
    <Panel
      title="Recent Events"
      subtitle={`${logs.length} events · last 30`}
      glow={danger.length ? "danger" : null}
      right={
        <Pill severity={danger.length ? "danger" : "ok"}>
          {danger.length ? (
            <>
              <AlertOctagon size={11} /> {danger.length} CRITICAL
            </>
          ) : (
            <>
              <ShieldCheck size={11} /> ALL CLEAR
            </>
          )}
        </Pill>
      }
    >
      <ul className="divide-y divide-zinc-800 overflow-hidden rounded border border-zinc-800 bg-zinc-950/40">
        {top.length === 0 ? (
          <li className="p-4 text-center text-[12px] text-zinc-500">
            No events yet — run a prediction or send an ESP32 command.
          </li>
        ) : null}
        {top.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900/40"
          >
            <StatusDot
              severity={a.severity}
              pulse={a.severity === "danger"}
            />
            <span className="w-12 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              {sevLabel[a.severity]}
            </span>
            <span className="w-28 truncate font-mono text-[11px] text-zinc-300">
              {a.source}
            </span>
            <span className="flex-1 truncate text-[12px] text-zinc-100">
              {a.message}
            </span>
            <span className="w-20 text-right font-mono text-[10px] text-zinc-500">
              {new Date(a.ts * 1000).toLocaleTimeString("en-GB", { hour12: false })}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
