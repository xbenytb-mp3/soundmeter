"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import DbChart from "@/components/DbChart";
import StatsDisplay from "@/components/StatsDisplay";
import TimeFrameBreakdown from "@/components/TimeFrameBreakdown";
import PdfExportButton from "@/components/PdfExportButton";

interface Reading {
  dbLevel: number;
  timestamp: string;
}

interface Stats {
  min: number | null;
  max: number | null;
  avg: number | null;
}

const TIME_RANGES = [
  { label: "1 min", ms: 60_000 },
  { label: "1 hour", ms: 3_600_000 },
  { label: "4 hours", ms: 14_400_000 },
];

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatThaiDate(d: Date) {
  const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const months = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function isToday(d: Date) {
  const now = new Date();
  return toDateString(d) === toDateString(now);
}

export default function ReportPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [readings, setReadings] = useState<Reading[]>([]);
  const [allStats, setAllStats] = useState<Stats>({ min: null, max: null, avg: null });
  const [timeRange, setTimeRange] = useState(14_400_000);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goDay = (offset: number) => {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + offset);
      // Don't go past today
      if (d > new Date()) return prev;
      return d;
    });
  };

  const fetchReadings = useCallback(async () => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    try {
      const res = await fetch(
        `/api/readings?from=${dayStart.toISOString()}&to=${dayEnd.toISOString()}&limit=10000&t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setReadings(data.readings);
        setAllStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch readings:", err);
    }
  }, [selectedDate]);

  // Fetch on date change + poll if viewing today
  useEffect(() => {
    fetchReadings();

    if (pollRef.current) clearInterval(pollRef.current);
    if (isToday(selectedDate)) {
      pollRef.current = setInterval(fetchReadings, 2500);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchReadings, selectedDate]);

  // Filter readings by selected time range (relative to latest reading)
  const latestTime = readings.length > 0
    ? new Date(readings[readings.length - 1].timestamp).getTime()
    : Date.now();
  const filtered = readings.filter(
    (r) => latestTime - new Date(r.timestamp).getTime() <= timeRange
  );

  const labels = filtered.map((r) =>
    new Date(r.timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
  const values = filtered.map((r) => r.dbLevel);

  const visMin = values.length > 0 ? Math.min(...values) : Infinity;
  const visMax = values.length > 0 ? Math.max(...values) : -Infinity;
  const visAvg =
    values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

  const hasData = readings.length > 0;
  const firstTimestamp = hasData ? readings[0].timestamp : new Date().toISOString();

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto p-4 space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-center">Report</h1>

        {/* Date navigator */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => goDay(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            &lsaquo;
          </button>
          <span className="text-lg font-medium min-w-[140px] text-center">
            {isToday(selectedDate) ? "Today" : formatThaiDate(selectedDate)}
          </span>
          <button
            onClick={() => goDay(1)}
            disabled={isToday(selectedDate)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &rsaquo;
          </button>
        </div>

        {hasData ? (
          <>
            {/* PDF export */}
            <div className="flex justify-end">
              <PdfExportButton
                title=""
                date={selectedDate}
                minDb={allStats.min}
                maxDb={allStats.max}
                avgDb={allStats.avg}
              />
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Range:</span>
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.ms}
                  onClick={() => setTimeRange(tr.ms)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    timeRange === tr.ms
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            <DbChart labels={labels} data={values} />

            {/* Stats for visible range */}
            <StatsDisplay min={visMin} max={visMax} avg={visAvg} />

            {/* Time frame breakdown */}
            <TimeFrameBreakdown
              readings={readings}
              sessionStart={firstTimestamp}
            />
          </>
        ) : (
          <div className="text-center text-gray-500 py-20">
            No data for this date.
          </div>
        )}
      </main>
    </>
  );
}
