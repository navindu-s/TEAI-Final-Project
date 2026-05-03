export type Severity = "ok" | "warn" | "danger" | "info";

const COLOR: Record<Severity, string> = {
  ok: "bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.55)]",
  warn: "bg-amber-400 shadow-[0_0_8px_2px_rgba(245,158,11,0.55)]",
  danger: "bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.65)]",
  info: "bg-sky-400 shadow-[0_0_8px_2px_rgba(56,189,248,0.55)]",
};

export function StatusDot({
  severity,
  pulse = false,
  size = "md",
}: {
  severity: Severity;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-2 w-2" : size === "lg" ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  return (
    <span
      className={`inline-block rounded-full ${dim} ${COLOR[severity]} ${
        pulse ? "animate-pulse" : ""
      }`}
    />
  );
}
