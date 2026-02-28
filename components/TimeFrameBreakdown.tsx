"use client";

interface ReadingPoint {
  dbLevel: number;
  timestamp: string;
}

function getLevel(avg: number): { label: string; className: string } {
  if (avg > 85) return { label: "Danger", className: "text-red-400" };
  if (avg > 70) return { label: "Warning", className: "text-yellow-400" };
  return { label: "Safe", className: "text-green-400" };
}

export default function TimeFrameBreakdown({
  readings,
  sessionStart,
}: {
  readings: ReadingPoint[];
  sessionStart: string;
}) {
  const start = new Date(sessionStart);
  const startOfDay = new Date(start);
  startOfDay.setHours(0, 0, 0, 0);

  const frames = Array.from({ length: 6 }, (_, i) => {
    const fStart = startOfDay.getTime() + i * 4 * 3600000;
    const fEnd = fStart + 4 * 3600000;
    const frameReadings = readings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= fStart && t < fEnd;
    });

    const vals = frameReadings.map((r) => r.dbLevel);
    const min = vals.length > 0 ? Math.min(...vals) : null;
    const max = vals.length > 0 ? Math.max(...vals) : null;
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

    return {
      label: `${String(i * 4).padStart(2, "0")}:00 - ${String((i + 1) * 4).padStart(2, "0")}:00`,
      min,
      max,
      avg,
      count: frameReadings.length,
      readings: frameReadings,
      from: new Date(fStart).toISOString(),
      to: new Date(fEnd).toISOString(),
    };
  });

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-2">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        Time Frame Breakdown (4hr slots)
      </h3>
      {frames.map((f, i) => {
        const level = f.avg !== null ? getLevel(f.avg) : null;
        const hasData = f.avg !== null;

        return (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-2 text-sm border-b border-gray-800 last:border-0"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-300">{f.label}</span>
              {hasData ? (
                <div className="flex gap-3 text-xs text-gray-400">
                  <span>Min <span className="text-green-400">{f.min!.toFixed(1)}</span></span>
                  <span>Max <span className="text-red-400">{f.max!.toFixed(1)}</span></span>
                  <span>Avg <span className={level?.className || ""}>{f.avg!.toFixed(1)}</span></span>
                  {level && <span className={`${level.className} text-xs`}>({level.label})</span>}
                </div>
              ) : (
                <span className="text-gray-600">--</span>
              )}
            </div>

            {hasData && (
              <a
                href={`/report/timeframe?from=${encodeURIComponent(f.from)}&to=${encodeURIComponent(f.to)}&label=${encodeURIComponent(f.label)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded bg-cyan-600/80 hover:bg-cyan-600 text-white transition-colors"
              >
                Detail
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
