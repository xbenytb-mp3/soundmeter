"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import DbChart from "@/components/DbChart";
import StatsDisplay from "@/components/StatsDisplay";
import PdfExportButton from "@/components/PdfExportButton";

interface Reading {
  dbLevel: number;
  timestamp: string;
}

export default function TimeFrameDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>}>
      <TimeFrameContent />
    </Suspense>
  );
}

function TimeFrameContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const label = searchParams.get("label") || "Time Frame";

  const dateStr = from
    ? new Date(from).toLocaleDateString("th-TH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
    if (!from || !to) return;
    try {
      const res = await fetch(
        `/api/readings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=10000`
      );
      if (res.ok) {
        const data = await res.json();
        setReadings(data.readings);
      }
    } catch (err) {
      console.error("Failed to fetch readings:", err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const labels = readings.map((r) =>
    new Date(r.timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
  const values = readings.map((r) => r.dbLevel);

  const min = values.length > 0 ? Math.min(...values) : null;
  const max = values.length > 0 ? Math.max(...values) : null;
  const avg =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto p-4 space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{label}</h1>
            {dateStr && <p className="text-sm text-gray-400">{dateStr}</p>}
          </div>
          <a
            href="/report"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Report
          </a>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : readings.length > 0 ? (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {readings.length} readings
              </span>
              <PdfExportButton
                title={label}
                date={from ? new Date(from) : new Date()}
                minDb={min}
                maxDb={max}
                avgDb={avg}
              />
            </div>

            {/* Chart */}
            <DbChart labels={labels} data={values} />

            {/* Stats */}
            <StatsDisplay
              min={min ?? Infinity}
              max={max ?? -Infinity}
              avg={avg ?? 0}
            />

            {/* Readings table */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Readings
              </h3>
              <div className="max-h-80 overflow-y-auto space-y-0.5">
                {readings.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs py-1 px-2 text-gray-300"
                  >
                    <span>
                      {new Date(r.timestamp).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span
                      className={
                        r.dbLevel > 85
                          ? "text-red-400"
                          : r.dbLevel > 70
                            ? "text-yellow-400"
                            : "text-green-400"
                      }
                    >
                      {r.dbLevel.toFixed(1)} dB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-20">
            No data for this time frame.
          </div>
        )}
      </main>
    </>
  );
}
