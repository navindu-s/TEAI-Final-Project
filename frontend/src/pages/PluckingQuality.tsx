import { useState } from "react";
import { api } from "../api";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";
import { ImageUpload } from "../components/ui/ImageUpload";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { RunButton } from "../components/ui/RunButton";
import { ErrorBox, PageHeader, ResultPill } from "./PageHeader";

interface Result {
  predicted_class: string;
  confidence: number;
  status: "ok" | "warn" | "danger" | "info";
  probs: Record<string, number>;
  img_size: number;
}

export default function PluckingQuality() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-session running tally
  const [tally, setTally] = useState<Record<string, number>>({});
  const total = Object.values(tally).reduce((a, b) => a + b, 0);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = (await api.plucking(file)) as Result;
      setResult(r);
      setTally((t) => ({ ...t, [r.predicted_class]: (t[r.predicted_class] ?? 0) + 1 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Plucking Quality Grading"
        subtitle="3-class image classifier on incoming green leaf"
        endpoint="POST /api/v1/plucking/classify"
        right={<ResultPill ok={!!result} error={error} />}
      />

      <ErrorBox error={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Input" subtitle="upload a tea-leaf frame">
          <div className="space-y-3">
            <ImageUpload value={file} onChange={setFile} />
            <RunButton loading={loading} disabled={!file} onClick={run}>
              Run classification
            </RunButton>
          </div>
        </Panel>

        <Panel title="Result" subtitle={result ? `confidence ${(result.confidence * 100).toFixed(1)}%` : "no result yet"}>
          {result ? (
            <div className="space-y-3">
              <div>
                <div className="label-xs">Predicted class</div>
                <div className="font-mono text-3xl font-semibold text-emerald-300">
                  {result.predicted_class}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  <span>confidence</span>
                  <span className="font-mono">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <ConfidenceBar value={result.confidence} severity={result.status} />
              </div>
              <div className="space-y-1.5">
                {Object.entries(result.probs).map(([cls, p]) => (
                  <div key={cls}>
                    <div className="flex justify-between text-[11px]">
                      <span className={cls === result.predicted_class ? "text-emerald-300" : "text-zinc-400"}>
                        {cls}
                      </span>
                      <span className="font-mono text-zinc-300">{(p * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-0.5 h-1 w-full overflow-hidden rounded bg-zinc-800">
                      <div
                        className={`h-full ${cls === result.predicted_class ? "bg-emerald-500" : "bg-zinc-600"}`}
                        style={{ width: `${p * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-2 text-[11px] text-zinc-500">
                model input · {result.img_size}² px
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-zinc-500">Run a classification to see results.</p>
          )}
        </Panel>

        <Panel
          title="Session tally"
          subtitle={`${total} samples graded this session`}
          right={
            total > 0 ? (
              <button
                onClick={() => setTally({})}
                className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-100"
              >
                Reset
              </button>
            ) : null
          }
        >
          {total === 0 ? (
            <p className="text-[12px] text-zinc-500">No samples graded yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(tally).map(([cls, count]) => (
                <li
                  key={cls}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2"
                >
                  <span className="text-[12px] text-zinc-200">{cls}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-zinc-300">{count}</span>
                    <Pill severity="info">{((count / total) * 100).toFixed(0)}%</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
