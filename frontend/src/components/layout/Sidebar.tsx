import {
  AlertOctagon,
  Camera,
  Gauge as GaugeIcon,
  LayoutDashboard,
  Leaf,
  LineChart,
  ScrollText,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEsp32 } from "../../hooks/useEsp32";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/vision-taster", label: "Vision Taster", icon: Camera },
  { to: "/plucking", label: "Plucking Quality", icon: Leaf },
  { to: "/withering", label: "Withering Control", icon: GaugeIcon },
  { to: "/foreign-particle", label: "Foreign Particles", icon: AlertOctagon },
  { to: "/auction-price", label: "Auction Price", icon: LineChart },
  { to: "/logs", label: "System Logs", icon: ScrollText },
];

export function Sidebar() {
  const { logs } = useEsp32();
  const dangerCount = logs.filter((a) => a.severity === "danger").length;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950/95">
      <nav className="flex-1 space-y-0.5 p-3">
        <div className="label-xs px-2 pb-2">Operations</div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded px-2.5 py-2 text-[13px] transition-colors",
                isActive
                  ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              ].join(" ")
            }
          >
            <n.icon size={16} className="shrink-0" />
            <span className="flex-1 truncate">{n.label}</span>
            {n.to === "/foreign-particle" && dangerCount > 0 ? (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] text-red-300 ring-1 ring-red-500/40">
                {dangerCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
