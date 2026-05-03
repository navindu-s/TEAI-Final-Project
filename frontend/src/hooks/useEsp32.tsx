import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ESP32State, LogEvent, SensorReading } from "../api";

interface Ctx {
  state: ESP32State | null;
  sensors: SensorReading | null;
  logs: LogEvent[];
  error: string | null;
  setConveyor: (s: "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED") => Promise<void>;
  setLights: (s: "ON" | "OFF") => Promise<void>;
  refresh: () => Promise<void>;
}

const Esp32Context = createContext<Ctx | null>(null);

export function Esp32Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ESP32State | null>(null);
  const [sensors, setSensors] = useState<SensorReading | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [s, sn, lg] = await Promise.all([
        api.esp32State(),
        api.esp32Sensors(),
        api.logs(30),
      ]);
      setState(s);
      setSensors(sn);
      setLogs(lg.events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  const setConveyor = useCallback(
    async (s: "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED") => {
      await api.esp32Conveyor(s);
      await refresh();
    },
    [refresh]
  );

  const setLights = useCallback(
    async (s: "ON" | "OFF") => {
      await api.esp32Lights(s);
      await refresh();
    },
    [refresh]
  );

  return (
    <Esp32Context.Provider value={{ state, sensors, logs, error, setConveyor, setLights, refresh }}>
      {children}
    </Esp32Context.Provider>
  );
}

export function useEsp32() {
  const ctx = useContext(Esp32Context);
  if (!ctx) throw new Error("useEsp32 must be used inside Esp32Provider");
  return ctx;
}
