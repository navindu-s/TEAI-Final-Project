import { Loader2, Play } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function RunButton({ loading, disabled, onClick, children }: Props) {
  return (
    <button
      disabled={loading || disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded bg-emerald-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-emerald-200 ring-1 ring-emerald-500/40 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
      {children}
    </button>
  );
}
