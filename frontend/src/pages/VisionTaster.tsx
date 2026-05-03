import { useState } from "react";
import { api } from "../api";
import { ConfidenceBar } from "../components/ui/ConfidenceBar";
import { ImageUpload } from "../components/ui/ImageUpload";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { RunButton } from "../components/ui/RunButton";
import { ErrorBox, PageHeader, ResultPill } from "./PageHeader";

interface Head {
  head: string;
  name: string;
  class: number;
  label: string;
  adjective: string;
  confidence: number;
  probs: number[];
  note: string;
}
interface Result {
  grade: string;
  score: number;
  mean_confidence: number;
  summary: string;
  heads: Head[];
  img_size: number;
}

export default function VisionTaster() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.visionTaster(file);
      setResult(r as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const gradeSeverity =
    result == null
      ? "info"
      : result.score >= 8
        ? "ok"
        : result.score >= 6
          ? "info"
          : result.score >= 4
            ? "warn"
            : "danger";

  return (
    <div>
      <PageHeader
        title="Vision Taster"
        subtitle="Multi-head CNN · 5 attribute heads (3 ordinal classes each)"
        endpoint="POST /api/v1/vision-taster/predict"
        right={<ResultPill ok={!!result} error={error} />}
      />

      <ErrorBox error={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Input" subtitle="upload a tea-leaf frame">
          <div className="space-y-3">
            <ImageUpload value={file} onChange={setFile} />
            <RunButton loading={loading} disabled={!file} onClick={run}>
              Run prediction
            </RunButton>
            <p className="text-[11px] text-zinc-500">
              Backend rescales the frame to {result?.img_size ?? 224}² and applies the
              same notebook preprocessing (decode → resize → /255).
            </p>
          </div>
        </Panel>

        <div className="xl:col-span-2 space-y-4">
          <Panel
            title="Verdict"
            subtitle={result ? `score ${result.score} / 10` : "no result yet"}
            right={result ? <Pill severity={gradeSeverity}>{result.grade}</Pill> : null}
          >
            {result ? (
              <div className="space-y-3">
                <div className="font-mono text-2xl font-semibold text-zinc-100">
                  {result.grade}
                </div>
                <p className="text-[12px] text-zinc-300">{result.summary}</p>
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                    <span>mean confidence</span>
                    <span className="font-mono text-zinc-300">
                      {(result.mean_confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <ConfidenceBar value={result.mean_confidence} severity={gradeSeverity} />
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-zinc-500">Run a prediction to see the verdict.</p>
            )}
          </Panel>

          {result ? (
            <Panel title="Per-head breakdown" subtitle="blackness · twist · evenness · bloom · cleanliness">
              <div className="space-y-2.5">
                {result.heads.map((h) => (
                  <div
                    key={h.head}
                    className="grid grid-cols-12 items-center gap-3 rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2.5"
                  >
                    <div className="col-span-2 text-[12px] font-semibold text-zinc-200">
                      {h.name}
                    </div>
                    <div className="col-span-3">
                      <div className="font-mono text-[13px] text-emerald-300">
                        {h.adjective}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        class {h.class} · {h.label}
                      </div>
                    </div>
                    <div className="col-span-4">
                      <div className="flex h-1.5 w-full overflow-hidden rounded bg-zinc-800">
                        {h.probs.map((p, i) => (
                          <div
                            key={i}
                            className={
                              i === h.class
                                ? "bg-emerald-500"
                                : i === 0
                                  ? "bg-zinc-700"
                                  : i === 1
                                    ? "bg-zinc-600"
                                    : "bg-zinc-500"
                            }
                            style={{ width: `${p * 100}%` }}
                          />
                        ))}
                      </div>
                      <div className="mt-1 flex justify-between font-mono text-[10px] text-zinc-500">
                        {h.probs.map((p, i) => (
                          <span key={i} className={i === h.class ? "text-emerald-300" : ""}>
                            {(p * 100).toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-mono text-[11px] text-zinc-300">
                      {(h.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="col-span-1" />
                    <div className="col-span-12 -mt-1 text-[11px] text-zinc-500">
                      {h.note}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
