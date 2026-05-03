import { useEffect, useState } from "react";
import { Server, Settings, Check, AlertCircle } from "lucide-react";
import { Panel } from "../ui/Panel";
import { Pill } from "../ui/Pill";
import { api } from "../../api";

export function ESP32ConfigPanel() {
  const [mode, setMode] = useState("mock");
  const [ip, setIp] = useState("172.20.10.5");
  const [port, setPort] = useState(8080);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    api.esp32State()
      .then((data) => {
        if (data.mode) setMode(data.mode);
        if (data.ip) setIp(data.ip);
        if (data.port) setPort(data.port);
      })
      .catch(console.error);
  }, []);

  const handleApply = async () => {
    setStatus("saving");
    try {
      await api.esp32Config(mode, ip, port);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <Panel title="ESP32 Connection Config" subtitle="Manage hardware connection">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Connection Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-[13px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="mock">Mock (No Hardware)</option>
              <option value="tcp">TCP Socket (Hardware)</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              ESP32 IP Address
            </label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              disabled={mode === "mock"}
              className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-[13px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
              placeholder="192.168.1.10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              TCP Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              disabled={mode === "mock"}
              className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-2 text-[13px] text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
              placeholder="8080"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 mt-1">
          <div className="flex items-center gap-2 text-[12px]">
            {status === "success" && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Check size={14} /> Configuration applied successfully
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertCircle size={14} /> Failed to save configuration
              </span>
            )}
            {status === "idle" && mode === "mock" && (
              <span className="text-zinc-500">
                Dashboard will run using simulated sensor data.
              </span>
            )}
            {status === "idle" && mode === "tcp" && (
              <span className="text-amber-500/80">
                Commands will be sent directly to {ip}:{port}.
              </span>
            )}
          </div>
          
          <button
            onClick={handleApply}
            disabled={status === "saving"}
            className="flex items-center gap-2 rounded bg-sky-500/10 border border-sky-500/20 px-4 py-1.5 text-[13px] font-semibold text-sky-400 transition-colors hover:bg-sky-500/20 disabled:opacity-50"
          >
            <Settings size={14} />
            {status === "saving" ? "Applying..." : "Apply Config"}
          </button>
        </div>
      </div>
    </Panel>
  );
}
