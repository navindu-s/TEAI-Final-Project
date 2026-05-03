const BASE = (import.meta.env.VITE_BACKEND_URL as string | undefined) || "http://localhost:8000";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} — ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export interface ESP32State {
  connected: boolean;
  conveyor: "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED";
  lights: "ON" | "OFF";
  mode: "serial" | "http" | "mock";
}

export interface SensorReading {
  temperature: number;
  humidity: number;
  weight: number;
  weight_loss_pct: number;
}

export interface LogEvent {
  id: string;
  ts: number;
  severity: "ok" | "warn" | "danger" | "info";
  source: string;
  message: string;
}

export const api = {
  base: BASE,
  esp32State: () => jsonFetch<ESP32State>("/api/v1/esp32/state"),
  esp32Sensors: () => jsonFetch<SensorReading>("/api/v1/esp32/sensors"),
  esp32Config: (mode: string, ip: string, port: number) =>
    jsonFetch("/api/v1/esp32/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, ip, port }),
    }),
  esp32Conveyor: (state: "RUNNING_CONT" | "RUNNING_STEP" | "STOPPED") =>
    jsonFetch("/api/v1/esp32/conveyor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }),
  esp32Lights: (state: "ON" | "OFF") =>
    jsonFetch("/api/v1/esp32/lights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    }),
  logs: (limit = 100) => jsonFetch<{ events: LogEvent[] }>(`/api/v1/logs?limit=${limit}`),

  visionTaster: (image: File) => uploadImage("/api/v1/vision-taster/predict", image),
  visionTasterLast: () => jsonFetch<any>("/api/v1/vision-taster/last"),
  plucking: (image: File) => uploadImage("/api/v1/plucking/classify", image),
  pluckingLast: () => jsonFetch<any>("/api/v1/plucking/last"),
  withering: (image: File, sensors?: { temperature?: number; humidity?: number; weight?: number }) => {
    const fd = new FormData();
    fd.append("image", image);
    if (sensors?.temperature != null) fd.append("temperature", String(sensors.temperature));
    if (sensors?.humidity != null) fd.append("humidity", String(sensors.humidity));
    if (sensors?.weight != null) fd.append("weight", String(sensors.weight));
    return jsonFetch<any>("/api/v1/withering/predict", { method: "POST", body: fd });
  },
  witheringLast: () => jsonFetch<any>("/api/v1/withering/last"),
  foreignParticle: (image: File, conf = 0.15, imgsz = 768) => {
    const fd = new FormData();
    fd.append("image", image);
    fd.append("conf", String(conf));
    fd.append("imgsz", String(imgsz));
    return jsonFetch<any>("/api/v1/foreign-particle/scan", { method: "POST", body: fd });
  },
  foreignParticleLast: () => jsonFetch<any>("/api/v1/foreign-particle/last"),
  auctionPrice: (input: {
    year: number;
    month: number;
    day_of_month: number;
    region: string;
    estate: string;
    grade: string;
  }) =>
    jsonFetch<any>("/api/v1/auction-price/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  auctionPriceOptions: () => jsonFetch<any>("/api/v1/auction-price/options"),
  auctionPriceLast: () => jsonFetch<any>("/api/v1/auction-price/last"),
};

async function uploadImage<T>(path: string, image: File): Promise<T> {
  const fd = new FormData();
  fd.append("image", image);
  return jsonFetch<T>(path, { method: "POST", body: fd });
}
