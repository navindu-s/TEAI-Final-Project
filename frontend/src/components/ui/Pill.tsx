import { ReactNode } from "react";
import { Severity } from "./StatusDot";

const STYLES: Record<Severity, string> = {
  ok: "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30",
  warn: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30",
  danger: "bg-red-500/10 text-red-300 ring-1 ring-red-500/30",
  info: "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/30",
};

export function Pill({
  severity = "info",
  children,
  className = "",
}: {
  severity?: Severity;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${STYLES[severity]} ${className}`}
    >
      {children}
    </span>
  );
}
