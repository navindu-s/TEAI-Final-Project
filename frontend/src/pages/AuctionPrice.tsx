import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { RunButton } from "../components/ui/RunButton";
import { ErrorBox, PageHeader, ResultPill } from "./PageHeader";

interface Options {
  regions: string[];
  grades: string[];
  estates_by_region: Record<string, string[]>;
  dataset_loaded: boolean;
}
interface Result {
  price_per_kg: number;
  model_name: string;
  target: string;
  features: string[];
  input: Record<string, string | number>;
}

const today = new Date();

export default function AuctionPrice() {
  const [options, setOptions] = useState<Options | null>(null);
  const [date, setDate] = useState<string>(today.toISOString().slice(0, 10));
  const [region, setRegion] = useState("");
  const [estate, setEstate] = useState("");
  const [grade, setGrade] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .auctionPriceOptions()
      .then((o) => {
        setOptions(o as Options);
        if (o.dataset_loaded && o.regions.length > 0) {
          setRegion(o.regions[0]);
          setEstate((o.estates_by_region[o.regions[0]] ?? [""])[0] ?? "");
          setGrade(o.grades[0] ?? "");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const estatesForRegion =
    options?.estates_by_region[region] ?? [];

  useEffect(() => {
    if (estatesForRegion.length > 0 && !estatesForRegion.includes(estate)) {
      setEstate(estatesForRegion[0]);
    }
  }, [region, estatesForRegion, estate]);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const [y, m, d] = date.split("-").map(Number);
      const r = (await api.auctionPrice({
        year: y,
        month: m,
        day_of_month: d,
        region,
        estate,
        grade,
      })) as Result;
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const ready = !!region && !!estate && !!grade;

  return (
    <div>
      <PageHeader
        title="Auction Price Predictor"
        subtitle="CatBoost regressor · trained on year, month, day, Region, Estate, Grade"
        endpoint="POST /api/v1/auction-price/predict"
        right={<ResultPill ok={!!result} error={error} />}
      />

      <ErrorBox error={error} />

      {options && !options.dataset_loaded ? (
        <div className="mb-3 rounded border border-amber-400/30 bg-amber-400/5 p-3 text-[12px] text-amber-200">
          Dropdown values aren't loaded — drop{" "}
          <span className="font-mono">component5_Tea_Prices_Combined.csv</span> into{" "}
          <span className="font-mono">backend/models/</span> to populate Region · Estate · Grade.
          You can still type values directly.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Input" subtitle="select date + lot details">
          <div className="space-y-3">
            <Field label="Date">
              <DatePicker value={date} onChange={setDate} />
            </Field>
            <Field label="Region">
              <Selector
                value={region}
                options={options?.regions ?? []}
                onChange={setRegion}
                allowFreeText={!options?.dataset_loaded}
              />
            </Field>
            <Field label="Estate">
              <Selector
                value={estate}
                options={estatesForRegion}
                onChange={setEstate}
                allowFreeText={!options?.dataset_loaded}
              />
            </Field>
            <Field label="Grade">
              <Selector
                value={grade}
                options={options?.grades ?? []}
                onChange={setGrade}
                allowFreeText={!options?.dataset_loaded}
              />
            </Field>
            <RunButton loading={loading} disabled={!ready} onClick={run}>
              Predict price
            </RunButton>
          </div>
        </Panel>

        <Panel
          title="Prediction"
          subtitle={result ? result.model_name : "no prediction yet"}
          className="xl:col-span-2"
        >
          {result ? (
            <div className="space-y-4">
              <div>
                <div className="label-xs">{result.target}</div>
                <div className="font-mono text-6xl font-semibold tabular-nums text-emerald-300">
                  Rs {result.price_per_kg.toFixed(2)}
                  <span className="ml-2 text-xl text-zinc-500">/ kg</span>
                </div>
              </div>

              <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="label-xs mb-2">Features sent</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[12px] md:grid-cols-3">
                  {result.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center justify-between rounded bg-zinc-900 px-2.5 py-1.5"
                    >
                      <span className="text-zinc-500">{f}</span>
                      <span className="text-zinc-200">{String(result.input[f])}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Pill severity="info">model · {result.model_name}</Pill>
            </div>
          ) : (
            <p className="text-[12px] text-zinc-500">
              Pick a date, region, estate, and grade — then run the prediction.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function DatePicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const display = value
    ? new Date(value).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Pick a date";

  return (
    <button
      type="button"
      onClick={open}
      className="flex w-full items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-left transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
    >
      <div className="flex items-center gap-2.5">
        <Calendar size={14} className="text-zinc-500" />
        <span className="font-mono text-[13px] text-zinc-100">{display}</span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {value || "—"}
      </span>
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute -z-10 h-0 w-0 opacity-0"
        style={{ colorScheme: "dark" }}
      />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-xs mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Selector({
  value,
  options,
  onChange,
  allowFreeText,
}: {
  value: string;
  options: string[];
  onChange: (s: string) => void;
  allowFreeText: boolean;
}) {
  if (options.length === 0 || allowFreeText) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[13px] text-zinc-100 placeholder:text-zinc-600"
        placeholder="type a value"
      />
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[13px] text-zinc-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
