import { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
  glow,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: "danger" | "warn" | null;
}) {
  const glowClass =
    glow === "danger"
      ? "ring-2 ring-red-500/60 shadow-[0_0_24px_rgba(239,68,68,0.25)]"
      : glow === "warn"
        ? "ring-1 ring-amber-400/40"
        : "";
  return (
    <section className={`panel ${glowClass} ${className}`}>
      <header className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
