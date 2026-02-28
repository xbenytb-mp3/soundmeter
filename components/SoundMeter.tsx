"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import MeterBar from "./MeterBar";
import DbCircle from "./DbCircle";
import StatsDisplay from "./StatsDisplay";

interface BufferedReading {
  dbLevel: number;
  timestamp: string;
}

export default function SoundMeter() {
  const [isRecording, setIsRecording] = useState(false);
  const [db, setDb] = useState(0);
  const [minDb, setMinDb] = useState(Infinity);
  const [maxDb, setMaxDb] = useState(-Infinity);
  const [avg, setAvg] = useState(0);
  const [status, setStatus] = useState("Click to allow microphone");

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const smoothDbRef = useRef(0);
  const windowBufRef = useRef<number[]>([]);
  const readingsBufferRef = useRef<BufferedReading[]>([]);
  const uploadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastReadingTimeRef = useRef(0);
  const secondBucketRef = useRef<number[]>([]);

  const uploadReadings = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid || readingsBufferRef.current.length === 0) return;

    const batch = readingsBufferRef.current.splice(0);
    try {
      const res = await fetch(`/api/sessions/${sid}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings: batch }),
      });
      if (!res.ok) {
        console.error("Upload failed:", res.status, await res.text());
        readingsBufferRef.current.unshift(...batch);
      }
    } catch {
      readingsBufferRef.current.unshift(...batch);
    }
  }, []);

  // Create a background session for grouping uploads
  const ensureSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      sessionIdRef.current = data.id;
      return data.id;
    } catch (err) {
      console.error("Failed to create session:", err);
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sid = await ensureSession();
      if (!sid) return;

      const audioContext = new AudioContext();
      if (audioContext.state === "suspended") await audioContext.resume();

      const analyser = audioContext.createAnalyser();
      const mic = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(2048, 1, 1);

      mic.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      processorRef.current = processor;

      smoothDbRef.current = 0;
      windowBufRef.current = [];
      readingsBufferRef.current = [];

      processor.onaudioprocess = () => {
        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
        let rawDb = 20 * Math.log10(Math.sqrt(sum / buffer.length)) + 100;

        if (!isFinite(rawDb) || isNaN(rawDb)) rawDb = 0;
        smoothDbRef.current += 0.12 * (rawDb - smoothDbRef.current);
        const currentDb = smoothDbRef.current;

        setDb(currentDb);
        setMinDb((prev) => Math.min(prev, currentDb));
        setMaxDb((prev) => Math.max(prev, currentDb));

        windowBufRef.current.push(currentDb);
        if (windowBufRef.current.length > 60) windowBufRef.current.shift();
        const avgVal =
          windowBufRef.current.reduce((a, b) => a + b, 0) /
          windowBufRef.current.length;
        setAvg(avgVal);

        // Bucket into 1 reading per second
        const now = Date.now();
        secondBucketRef.current.push(currentDb);
        if (now - lastReadingTimeRef.current >= 5000) {
          const avg =
            secondBucketRef.current.reduce((a, b) => a + b, 0) /
            secondBucketRef.current.length;
          readingsBufferRef.current.push({
            dbLevel: Math.round(avg * 10) / 10,
            timestamp: new Date().toISOString(),
          });
          secondBucketRef.current = [];
          lastReadingTimeRef.current = now;
        }
      };

      uploadIntervalRef.current = setInterval(uploadReadings, 5000);

      setIsRecording(true);
      setStatus("Recording...");
    } catch (err) {
      alert("Microphone Error: " + err);
    }
  }, [ensureSession, uploadReadings]);

  // Cleanup on unmount: flush readings, end session
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (uploadIntervalRef.current) {
        clearInterval(uploadIntervalRef.current);
      }
      // Fire-and-forget: flush + end session
      const sid = sessionIdRef.current;
      const remaining = readingsBufferRef.current.splice(0);
      if (sid && remaining.length > 0) {
        navigator.sendBeacon(
          `/api/sessions/${sid}/readings`,
          new Blob([JSON.stringify({ readings: remaining })], {
            type: "application/json",
          })
        );
      }
      if (sid) {
        navigator.sendBeacon(
          `/api/sessions/${sid}`,
          new Blob([JSON.stringify({ action: "end" })], {
            type: "application/json",
          })
        );
      }
    };
  }, []);

  // Resume audio context on user interaction
  useEffect(() => {
    const handleClick = () => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  const warning = db > 85 ? "LOUD!" : db > 70 ? "Moderate" : "";

  return (
    <div className="max-w-lg mx-auto space-y-6 p-4">
      {/* Status */}
      <div className="flex items-center justify-center gap-2">
        {isRecording && (
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        )}
        <span className="text-gray-300">{status}</span>
      </div>

      {/* Report button - opens new window */}
      <a
        href="/report"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-center transition-colors"
      >
        View Live Report
      </a>

      {/* Stats */}
      <StatsDisplay min={minDb} max={maxDb} avg={avg} />

      {/* Meter Bar */}
      <MeterBar db={db} />

      {/* dB Circle */}
      <DbCircle db={db} warning={warning} />

      {/* Start mic */}
      {!isRecording && (
        <button
          onClick={startRecording}
          className="w-full py-4 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-lg transition-colors"
        >
          CLICK TO START
        </button>
      )}
    </div>
  );
}
