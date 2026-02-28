"use client";

export default function DbCircle({ db, warning }: { db: number; warning?: string }) {
  return (
    <div className="w-56 h-56 mx-auto rounded-full border-[6px] border-cyan-400 bg-black flex flex-col items-center justify-center">
      <div className="text-4xl font-bold text-cyan-400">
        {db > 0 ? db.toFixed(1) : "--"} dB
      </div>
      {warning && (
        <div className="text-orange-400 text-sm mt-2">{warning}</div>
      )}
    </div>
  );
}
