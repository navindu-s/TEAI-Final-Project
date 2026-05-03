import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { api } from "../api";
import { SensorDashboard } from "../components/panels/SensorDashboard";
import { ImageUpload } from "../components/ui/ImageUpload";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { RunButton } from "../components/ui/RunButton";
import { useEsp32 } from "../hooks/useEsp32";
import { ErrorBox, PageHeader, ResultPill } from "./PageHeader";

interface Result {
  stage_id: number;
  stage_name: string;
  stage_confidence: number;
  class_probs: Record<string, number>;
  cumulative_probs: number[];
  remaining_time_min: number;
  remaining_time_hr: number;
  sensors: {
    temperature_c: number;
    humidity_pct: number;
    current_weight_g: number;
    initial_weight_g: number;
    weight_loss_g: number;
    weight_loss_pct: number;
  };
  scaler_loaded: boolean;
}

export default function WitheringControl() {
  const { sensors, refresh } = useEsp32();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overrideTemp, setOverrideTemp] = useState<string>("");
  const [overrideHum, setOverrideHum] = useState<string>("");
  const [overrideWeight, setOverrideWeight] = useState<string>("");

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = (await api.withering(file, {
        temperature: overrideTemp ? Number(overrideTemp) : undefined,
        humidity: overrideHum ? Number(overrideHum) : undefined,
        weight: overrideWeight ? Number(overrideWeight) : undefined,
      })) as Result;
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const stageColor = (sid: number) =>
    sid === 4 ? "ok" : sid === 5 ? "danger" : sid === 0 || sid === 1 ? "warn" : "info";

  return (
    <div>
      <PageHeader
        title="Withering Stage Monitoring"
        subtitle="TeaWitherNet (PyTorch) + remaining-time regressor + ESP32 sensor fusion"
        endpoint="POST /api/v1/withering/predict"
        right={<ResultPill ok={!!result} error={error} />}
      />

      <ErrorBox error={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Input" subtitle="image + sensors (live or override)">
          <div className="space-y-3">
            <ImageUpload value={file} onChange={setFile} />

            <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="label-xs">Sensor inputs</div>
                <button
                  onClick={refresh}
                  className="flex items-center gap-1 rounded bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-100"
                >
                  <RefreshCw size={10} /> Read live
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <SensorOverride
                  label="Temp °C"
                  live={sensors?.temperature}
                  value={overrideTemp}
                  onChange={setOverrideTemp}
                />
                <SensorOverride
                  label="Hum %"
                  live={sensors?.humidity}
                  value={overrideHum}
                  onChange={setOverrideHum}
                />
                <SensorOverride
                  label="Weight g"
                  live={sensors?.weight}
                  value={overrideWeight}
                  onChange={setOverrideWeight}
                />
              </div>
              <p className="mt-2 text-[10px] text-zinc-500">
                Empty = use live ESP32 reading. Override only when calibrating.
              </p>
            </div>

            <RunButton loading={loading} disabled={!file} onClick={run}>
              Run prediction
            </RunButton>
          </div>
        </Panel>

        <Panel title="Result" subtitle={result ? `${result.stage_name}` : "no result yet"}>
          {result ? (
            <div className="space-y-3">
              <div>
                <div className="label-xs">Predicted stage</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <div className="font-mono text-2xl font-semibold text-emerald-300">
                    {result.stage_name}
                  </div>
                  <Pill severity={stageColor(result.stage_id)}>id {result.stage_id}</Pill>
                </div>
                <div className="mt-1 font-mono text-[11px] text-zinc-500">
                  confidence {(result.stage_confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-baseline justify-between">
                  <div className="label-xs">Remaining time</div>
                  <span className="font-mono text-[10px] text-zinc-500">
                    Model 2 · {result.scaler_loaded ? "scaled" : "RAW (no scaler)"}
                  </span>
                </div>
                <div className="font-mono text-3xl font-semibold tabular-nums text-zinc-100">
                  {result.remaining_time_min.toFixed(0)}
                  <span className="ml-2 text-base text-zinc-500">min</span>
                  <span className="ml-3 text-sm text-zinc-400">
                    ({result.remaining_time_hr.toFixed(2)} h)
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {Object.entries(result.class_probs).map(([cls, p]) => (
                  <div key={cls}>
                    <div className="flex justify-between text-[11px]">
                      <span
                        className={cls === result.stage_name ? "text-emerald-300" : "text-zinc-400"}
                      >
                        {cls}
                      </span>
                      <span className="font-mono text-zinc-300">{(p * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-zinc-800">
                      <div
                        className={`h-full ${cls === result.stage_name ? "bg-emerald-500" : "bg-zinc-600"}`}
                        style={{ width: `${p * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-zinc-500">Upload a frame and run the prediction.</p>
          )}
        </Panel>

        <Panel title="Sensor snapshot used" subtitle="weight loss vs initial 100 g">
          {result ? (
            <div className="space-y-2 font-mono text-[12px]">
              <Row label="Temperature" value={`${result.sensors.temperature_c.toFixed(1)} °C`} />
              <Row label="Humidity" value={`${result.sensors.humidity_pct.toFixed(1)} %`} />
              <Row label="Initial weight" value={`${result.sensors.initial_weight_g.toFixed(1)} g`} />
              <Row label="Current weight" value={`${result.sensors.current_weight_g.toFixed(1)} g`} />
              <Row label="Weight loss" value={`${result.sensors.weight_loss_g.toFixed(2)} g`} />
              <Row label="Weight loss %" value={`${result.sensors.weight_loss_pct.toFixed(2)} %`} />
            </div>
          ) : (
            <p className="text-[12px] text-zinc-500">Run a prediction to see the sensor snapshot.</p>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <SensorDashboard />
      </div>
    </div>
  );
}

function SensorOverride({
  label,
  live,
  value,
  onChange,
}: {
  label: string;
  live: number | undefined;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div>
      <div className="label-xs">{label}</div>
      <input
        value={value}
        placeholder={live != null ? live.toFixed(1) : "—"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[12px] text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/40 px-3 py-1.5">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-100">{value}</span>
    </div>
  );
}
