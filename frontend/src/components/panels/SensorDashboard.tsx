import { Droplets, Scale, Thermometer, TrendingDown } from "lucide-react";
import { useEsp32 } from "../../hooks/useEsp32";
import { Gauge } from "../ui/Gauge";
import { Panel } from "../ui/Panel";

export function SensorDashboard() {
  const { sensors } = useEsp32();

  return (
    <Panel
      title="Live Sensor Readings"
      subtitle={sensors ? "ESP32 /states · 2.5 s polling" : "no readings yet"}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SensorCard
          icon={<Thermometer size={14} />}
          label="Temperature"
          gauge={
            <Gauge
              value={sensors?.temperature ?? 0}
              min={15}
              max={40}
              unit="°C"
              thresholds={{ warn: 27, danger: 32 }}
              size={130}
            />
          }
          target="22 – 27 °C"
        />
        <SensorCard
          icon={<Droplets size={14} />}
          label="Humidity"
          gauge={
            <Gauge
              value={sensors?.humidity ?? 0}
              min={30}
              max={90}
              unit="%RH"
              thresholds={{ warn: 70, danger: 80 }}
              size={130}
            />
          }
          target="60 – 68 %"
        />
        <SensorCard
          icon={<Scale size={14} />}
          label="Load Cell"
          gauge={
            <Gauge
              value={sensors?.weight ?? 0}
              min={0}
              max={120}
              unit="g"
              thresholds={{ warn: 10000, danger: 10000 }}
              size={130}
            />
          }
          target="initial: 100 g"
        />
        <div className="flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <TrendingDown size={14} />
            <span className="label-xs">Weight loss · withering</span>
          </div>
          <div className="font-mono text-4xl font-semibold tabular-nums text-emerald-300">
            {sensors ? sensors.weight_loss_pct.toFixed(1) : "—"}
            <span className="text-lg text-zinc-500"> %</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            target band <span className="text-zinc-200">28 – 32%</span>
          </div>
          <div className="mt-2">
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, ((sensors?.weight_loss_pct ?? 0) / 32) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SensorCard({
  icon,
  label,
  gauge,
  target,
}: {
  icon: React.ReactNode;
  label: string;
  gauge: React.ReactNode;
  target: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded border border-zinc-800 bg-zinc-950/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-400">
          {icon}
          <span className="label-xs">{label}</span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">live</span>
      </div>
      <div className="flex items-center justify-center">{gauge}</div>
      <div className="border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
        target {target}
      </div>
    </div>
  );
}
