import { ReactNode } from "react";
import { Pill } from "../components/ui/Pill";

export function PageHeader({
  title,
  subtitle,
  endpoint,
  right,
}: {
  title: string;
  subtitle: string;
  endpoint: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 pb-4">
      <div>
        <div className="label-xs">Module</div>
        <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-[12px] text-zinc-400">{subtitle}</p>
        <div className="mt-2 inline-block rounded bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-500 ring-1 ring-zinc-800">
          {endpoint}
        </div>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

export function ResultPill({ ok, error }: { ok: boolean; error: string | null }) {
  if (error) return <Pill severity="danger">ERROR</Pill>;
  if (ok) return <Pill severity="ok">RESULT READY</Pill>;
  return <Pill severity="info">IDLE</Pill>;
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 p-3 font-mono text-[12px] text-red-200">
      {error}
    </div>
  );
}
