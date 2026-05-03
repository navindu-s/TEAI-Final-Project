import { Outlet } from "react-router-dom";
import { useEsp32 } from "../../hooks/useEsp32";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Shell() {
  const { logs, error } = useEsp32();
  const lastDanger = logs.find((l) => l.severity === "danger");
  const showBanner = !!error || !!lastDanger;

  return (
    <div className="flex h-full min-h-screen flex-col">
      <TopBar />
      {showBanner ? (
        <div className="flex items-center justify-center gap-3 border-b border-red-500/40 bg-red-500/10 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-red-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          {error ? `Backend: ${error.slice(0, 80)}` : lastDanger?.message}
        </div>
      ) : null}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          <div className="mx-auto max-w-[1600px] p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
