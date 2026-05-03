interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  thresholds?: { warn: number; danger: number };
  size?: number;
}

export function Gauge({
  value,
  min = 0,
  max = 100,
  unit = "",
  label = "",
  thresholds,
  size = 140,
}: GaugeProps) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const radius = size / 2 - 10;
  const c = size / 2;
  const startAngle = Math.PI * 0.75;
  const endAngle = Math.PI * 2.25;
  const a = startAngle + (endAngle - startAngle) * pct;
  const x = c + radius * Math.cos(a);
  const y = c + radius * Math.sin(a);
  const trackPath = describeArc(c, c, radius, startAngle, endAngle);
  const valuePath = describeArc(c, c, radius, startAngle, a);

  let color = "#10b981";
  if (thresholds) {
    if (value >= thresholds.danger) color = "#ef4444";
    else if (value >= thresholds.warn) color = "#f59e0b";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="block">
        <path
          d={trackPath}
          stroke="#27272a"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={valuePath}
          stroke={color}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={5} fill={color} />
        <text
          x={c}
          y={c - 4}
          textAnchor="middle"
          className="fill-zinc-100 font-mono"
          style={{ fontSize: size * 0.2, fontWeight: 600 }}
        >
          {value.toFixed(1)}
        </text>
        <text
          x={c}
          y={c + size * 0.13}
          textAnchor="middle"
          className="fill-zinc-500"
          style={{ fontSize: size * 0.09, letterSpacing: 1 }}
        >
          {unit}
        </text>
      </svg>
      {label ? (
        <div className="label-xs mt-1 text-center">{label}</div>
      ) : null}
    </div>
  );
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number
) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number
) {
  const startPt = polarToCartesian(cx, cy, r, start);
  const endPt = polarToCartesian(cx, cy, r, end);
  const large = end - start <= Math.PI ? 0 : 1;
  return [
    "M",
    startPt.x,
    startPt.y,
    "A",
    r,
    r,
    0,
    large,
    1,
    endPt.x,
    endPt.y,
  ].join(" ");
}
