"use client";

export default function StatsDisplay({
  min,
  max,
  avg,
}: {
  min: number;
  max: number;
  avg: number;
}) {
  return (
    <div className="flex justify-around gap-4">
      <div className="text-center">
        <div className="text-sm text-gray-400">MIN</div>
        <div className="text-2xl font-bold text-cyan-400">
          {min === Infinity ? "0.0" : min.toFixed(1)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-400">MAX</div>
        <div className="text-2xl font-bold text-cyan-400">
          {max === -Infinity ? "0.0" : max.toFixed(1)}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-gray-400">AVG</div>
        <div className="text-2xl font-bold text-cyan-400">
          {avg > 0 ? avg.toFixed(1) : "0.0"}
        </div>
      </div>
    </div>
  );
}
