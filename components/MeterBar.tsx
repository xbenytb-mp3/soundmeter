"use client";

export default function MeterBar({ db }: { db: number }) {
  const pct = Math.min(100, Math.max(0, (db / 120) * 100));

  return (
    <div className="w-full h-10 border-2 border-gray-500 rounded relative overflow-hidden"
      style={{
        background: "linear-gradient(to right, limegreen, yellow, orange, orangered, red)",
      }}
    >
      <div
        className="absolute top-[-4px] w-1 h-12 bg-white shadow-[0_0_10px_white] transition-[left] duration-100"
        style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}
