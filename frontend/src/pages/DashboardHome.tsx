import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ConveyorControl } from "../components/panels/ConveyorControl";
import { ESP32ConfigPanel } from "../components/panels/ESP32ConfigPanel";
import { SafetyAlerts } from "../components/panels/SafetyAlerts";
import { SensorDashboard } from "../components/panels/SensorDashboard";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";

const COMPONENTS = [
  {
    to: "/vision-taster",
    name: "Vision Taster",
    desc: "Multi-head CNN · 5 attribute heads · 3 ordinal classes each",
    accent: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  },
  {
    to: "/plucking",
    name: "Plucking Quality",
    desc: "3-class image classifier · Best / Below Best / Poor",
    accent: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  },
  {
    to: "/withering",
    name: "Withering Stage",
    desc: "TeaWitherNet (PyTorch) + remaining-time regressor + sensor fusion",
    accent: "bg-amber-400/10 text-amber-200 ring-amber-400/30",
  },
  {
    to: "/foreign-particle",
    name: "Foreign Particle",
    desc: "YOLOv8 detector · auto-stops conveyor on detection",
    accent: "bg-red-500/10 text-red-300 ring-red-500/30",
  },
  {
    to: "/auction-price",
    name: "Auction Price",
    desc: "CatBoost regressor · price ₹/kg from date + region + estate + grade",
    accent: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
  },
];

export default function DashboardHome() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <ESP32ConfigPanel />
          <ConveyorControl />
        </div>
        <Panel title="Inference modules" subtitle="real models · upload to run">
          <ul className="space-y-2">
            {COMPONENTS.map((c) => (
              <li key={c.to}>
                <Link
                  to={c.to}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 transition-colors hover:bg-zinc-900"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-zinc-100">{c.name}</div>
                    <div className="truncate text-[11px] text-zinc-500">{c.desc}</div>
                  </div>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded ring-1 ${c.accent}`}
                  >
                    <ArrowUpRight size={14} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <SensorDashboard />
      <SafetyAlerts />

      <Panel title="API surface" subtitle="all routes the frontend talks to">
        <div className="grid grid-cols-1 gap-2 font-mono text-[11px] md:grid-cols-2">
          {[
            ["GET", "/api/v1/esp32/state", "ESP32 connection + conveyor + lights"],
            ["GET", "/api/v1/esp32/sensors", "live temperature · humidity · load cell"],
            ["POST", "/api/v1/esp32/conveyor", "RUN / STOP commands"],
            ["POST", "/api/v1/esp32/lights", "ON / OFF commands"],
            ["POST", "/api/v1/vision-taster/predict", "multipart image → 5-head CNN"],
            ["POST", "/api/v1/plucking/classify", "multipart image → 3-class"],
            ["POST", "/api/v1/withering/predict", "image + sensors → stage + remaining time"],
            ["POST", "/api/v1/foreign-particle/scan", "image → YOLOv8 detections"],
            ["POST", "/api/v1/auction-price/predict", "JSON {year, month, day, region, estate, grade} → ₹/kg"],
            ["GET", "/api/v1/logs", "recent events"],
          ].map(([m, p, d]) => (
            <div key={p} className="flex items-center gap-2 rounded border border-zinc-800 bg-zinc-950/40 px-3 py-1.5">
              <Pill severity={m === "POST" ? "warn" : "info"}>{m}</Pill>
              <span className="font-semibold text-zinc-200">{p}</span>
              <span className="ml-auto truncate text-zinc-500">{d}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
