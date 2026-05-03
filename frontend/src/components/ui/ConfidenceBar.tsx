import { Severity } from "./StatusDot";

const COLOR: Record<Severity, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  danger: "bg-red-500",
  info: "bg-sky-400",
};

export function ConfidenceBar({
  value,
  severity = "info",
}: {
  value: number;
  severity?: Severity;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded bg-zinc-800">
        <div
          className={`h-full ${COLOR[severity]} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
