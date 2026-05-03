import { Cpu, Power, Radio } from "lucide-react";
import { useClock } from "../../hooks/useClock";
import { useEsp32 } from "../../hooks/useEsp32";
import { Pill } from "../ui/Pill";
import { StatusDot } from "../ui/StatusDot";

const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour12: false });
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function TopBar() {
  const { state, error } = useEsp32();
  const now = useClock();

  const backendOk = !error;
  const conveyor = state?.conveyor ?? "—";
  const esp32Linked = !!state?.connected;

  return (
    <header
      className={`flex h-14 shrink-0 items-center gap-6 border-b border-zinc-800 bg-zinc-950/95 px-5 ${
        !backendOk ? "ring-1 ring-red-500/60" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-500/10 ring-1 ring-emerald-500/30">
          <span className="font-mono text-sm font-bold text-emerald-300">T</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide">TEAI Platform</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Tea Factory Control
          </div>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-zinc-800 md:block" />

      <div className="flex flex-1 items-center gap-3">
        <Block
          icon={<Power size={14} />}
          label="Backend"
          value={backendOk ? "ONLINE" : "OFFLINE"}
          severity={backendOk ? "ok" : "danger"}
        />
        <Block
          icon={<Cpu size={14} />}
          label="ESP32"
          value={esp32Linked ? state!.mode.toUpperCase() : "MOCK"}
          severity={esp32Linked && state!.mode !== "mock" ? "ok" : "warn"}
        />
        <Block
          icon={<Radio size={14} />}
          label="Conveyor"
          value={conveyor}
          severity={conveyor === "RUNNING" ? "ok" : "warn"}
        />
        {state?.lights ? (
          <Pill severity={state.lights === "ON" ? "warn" : "info"}>
            LIGHTS · {state.lights}
          </Pill>
        ) : null}
      </div>

      <div className="text-right leading-tight">
        <div className="font-mono text-base tabular-nums text-zinc-100">{fmtTime(now)}</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">{fmtDate(now)}</div>
      </div>
    </header>
  );
}

function Block({
  icon,
  label,
  value,
  severity,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  severity: "ok" | "warn" | "danger" | "info";
}) {
  return (
    <div className="flex items-center gap-2 rounded border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1.5">
      <StatusDot severity={severity} pulse={severity === "danger"} />
      <div className="flex items-center gap-1.5 text-zinc-500">{icon}</div>
      <div className="leading-tight">
        <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
        <div className="font-mono text-[12px] font-semibold text-zinc-100">{value}</div>
      </div>
    </div>
  );
}
