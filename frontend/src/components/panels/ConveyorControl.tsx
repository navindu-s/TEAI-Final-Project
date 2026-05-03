import { Lightbulb, FastForward, StepForward, Square } from "lucide-react";
import { useState } from "react";
import { useEsp32 } from "../../hooks/useEsp32";
import { Panel } from "../ui/Panel";
import { Pill } from "../ui/Pill";
import { StatusDot } from "../ui/StatusDot";

export function ConveyorControl() {
  const { state, setConveyor, setLights } = useEsp32();
  const [pending, setPending] = useState(false);
  const running = state?.conveyor === "RUNNING_CONT" || state?.conveyor === "RUNNING_STEP";

  const setMode = async (mode: "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED") => {
    setPending(true);
    try {
      await setConveyor(mode);
    } finally {
      setPending(false);
    }
  };

  const toggleLights = async () => {
    setPending(true);
    try {
      await setLights(state?.lights === "ON" ? "OFF" : "ON");
    } finally {
      setPending(false);
    }
  };

  return (
    <Panel
      title="Conveyor Control"
      subtitle={`ESP32 bridge · ${state?.mode ?? "—"}`}
      right={
        <Pill severity={pending ? "warn" : "ok"}>
          {pending ? "AWAITING ACK" : "READY"}
        </Pill>
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex flex-1 flex-col items-stretch justify-center gap-2 rounded border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="text-center mb-1">
            <div className="font-mono text-sm font-semibold text-zinc-400">BELT CONTROLS</div>
          </div>
          
          <button
            onClick={() => setMode("RUNNING_CONT")}
            disabled={!state || pending || state.conveyor === "RUNNING_CONT"}
            className={[
              "flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold tracking-[0.1em] transition-all disabled:opacity-50",
              state?.conveyor === "RUNNING_CONT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 animate-pulseRing"
                : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800",
            ].join(" ")}
          >
            <FastForward size={16} />
            CONTINUOUS
          </button>

          <button
            onClick={() => setMode("RUNNING_STEP")}
            disabled={!state || pending}
            className="flex items-center justify-center gap-2 rounded bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm font-bold tracking-[0.1em] text-sky-400 transition-all hover:bg-zinc-800 disabled:opacity-50"
          >
            <StepForward size={16} />
            STEP FORWARD
          </button>

          <button
            onClick={() => setMode("STOPPED")}
            disabled={!state || pending || state.conveyor === "STOPPED"}
            className={[
              "flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-bold tracking-[0.1em] transition-all disabled:opacity-50",
              state?.conveyor === "STOPPED"
                ? "bg-red-500/20 text-red-300 border border-red-500/50"
                : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800",
            ].join(" ")}
          >
            <Square size={16} />
            STOP BELT
          </button>
        </div>

        <div className="flex-[1.4] space-y-3">
          <div
            className={`relative h-16 w-full overflow-hidden rounded border border-zinc-800 ${
              running ? "belt-pattern animate-beltMove" : "bg-zinc-900"
            }`}
          >
            <div className="absolute inset-y-0 left-0 flex items-center px-3">
              <Pill severity={running ? "ok" : "warn"}>
                <StatusDot severity={running ? "ok" : "warn"} pulse={running} />
                {running ? "MOTION" : "STATIC"}
              </Pill>
            </div>
          </div>

          <button
            onClick={toggleLights}
            disabled={!state || pending}
            className={[
              "flex w-full items-center justify-between rounded border px-3 py-2.5 text-left transition-colors disabled:opacity-50",
              state?.lights === "ON"
                ? "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <Lightbulb size={14} />
              <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
                Inspection Lights
              </span>
            </div>
            <span className="font-mono text-sm">{state?.lights ?? "—"}</span>
          </button>
        </div>
      </div>
    </Panel>
  );
}
