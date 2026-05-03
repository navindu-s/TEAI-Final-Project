import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { ImageUpload } from "../components/ui/ImageUpload";
import { Panel } from "../components/ui/Panel";
import { Pill } from "../components/ui/Pill";
import { RunButton } from "../components/ui/RunButton";
import { ErrorBox, PageHeader, ResultPill } from "./PageHeader";

interface Detection {
  class_id: number;
  label: string;
  confidence: number;
  bbox_pixels: [number, number, number, number];
  bbox_norm: [number, number, number, number];
}
interface Result {
  detections: Detection[];
  auto_stop: boolean;
  image_size: { width: number; height: number };
  conf_threshold: number;
  imgsz: number;
}

export default function ForeignParticle() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conf, setConf] = useState(0.15);
  const [imgsz, setImgsz] = useState(768);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!previewUrl || !result || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      ctx.lineWidth = Math.max(2, Math.round(img.naturalWidth / 400));
      ctx.font = `${Math.max(12, Math.round(img.naturalWidth / 50))}px ui-monospace, monospace`;
      result.detections.forEach((d) => {
        const [x1, y1, x2, y2] = d.bbox_pixels;
        ctx.strokeStyle = "#ef4444";
        ctx.fillStyle = "#ef4444";
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        const tag = `${d.label} ${(d.confidence * 100).toFixed(0)}%`;
        const tw = ctx.measureText(tag).width + 10;
        ctx.fillRect(x1, Math.max(0, y1 - 22), tw, 22);
        ctx.fillStyle = "white";
        ctx.fillText(tag, x1 + 5, Math.max(14, y1 - 6));
      });
    };
    img.src = previewUrl;
  }, [previewUrl, result]);

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = (await api.foreignParticle(file, conf, imgsz)) as Result;
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Foreign Particle Detection"
        subtitle="YOLOv8 · auto-stop on detection"
        endpoint="POST /api/v1/foreign-particle/scan"
        right={<ResultPill ok={!!result} error={error} />}
      />

      <ErrorBox error={error} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Input" subtitle="upload a conveyor frame">
          <div className="space-y-3">
            <ImageUpload value={file} onChange={setFile} />

            <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-2">
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Confidence threshold</span>
                  <span className="font-mono text-zinc-200">{conf.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.95}
                  step={0.01}
                  value={conf}
                  onChange={(e) => setConf(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-400">Inference size</span>
                  <span className="font-mono text-zinc-200">{imgsz}²</span>
                </div>
                <select
                  value={imgsz}
                  onChange={(e) => setImgsz(parseInt(e.target.value, 10))}
                  className="mt-1 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[12px] text-zinc-100"
                >
                  {[640, 768, 896, 1024].map((s) => (
                    <option key={s} value={s}>
                      {s}² px
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <RunButton loading={loading} disabled={!file} onClick={run}>
              Run YOLOv8 scan
            </RunButton>
          </div>
        </Panel>

        <Panel
          title="Annotated frame"
          subtitle={result ? `${result.image_size.width} × ${result.image_size.height}` : "no scan yet"}
          glow={result?.auto_stop ? "danger" : null}
          className="xl:col-span-2"
        >
          {result ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded border border-zinc-800">
                <canvas ref={canvasRef} className="w-full h-auto bg-black" />
              </div>
              <div className="flex items-center gap-3">
                {result.auto_stop ? (
                  <Pill severity="danger">
                    <ShieldAlert size={11} /> AUTO-STOP — {result.detections.length} detection(s)
                  </Pill>
                ) : (
                  <Pill severity="ok">
                    <ShieldCheck size={11} /> CLEAR
                  </Pill>
                )}
                <span className="font-mono text-[11px] text-zinc-500">
                  conf ≥ {result.conf_threshold} · imgsz {result.imgsz}²
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-zinc-500">Upload a frame and run a scan.</p>
          )}
        </Panel>
      </div>

      {result && result.detections.length > 0 ? (
        <div className="mt-4">
          <Panel title="Detections" subtitle={`${result.detections.length} found`}>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  <th className="py-2">#</th>
                  <th>Class</th>
                  <th>Confidence</th>
                  <th>Bbox (px)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 font-mono">
                {result.detections.map((d, i) => (
                  <tr key={i} className="hover:bg-zinc-900/40">
                    <td className="py-2 text-zinc-500">{i + 1}</td>
                    <td className="text-zinc-100">{d.label} <span className="text-zinc-500">({d.class_id})</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded bg-zinc-800">
                          <div className="h-full bg-red-400" style={{ width: `${d.confidence * 100}%` }} />
                        </div>
                        <span className="text-zinc-300">{(d.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="text-zinc-400">
                      [{d.bbox_pixels.map((n) => n.toFixed(0)).join(", ")}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
