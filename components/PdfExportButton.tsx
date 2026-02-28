"use client";

import { useCallback } from "react";
import jsPDF from "jspdf";

interface Props {
  title: string;
  date: Date;
  minDb: number | null;
  maxDb: number | null;
  avgDb: number | null;
}

export default function PdfExportButton({
  title,
  date,
  minDb,
  maxDb,
  avgDb,
}: Props) {
  const exportPdf = useCallback(() => {
    const pdf = new jsPDF();
    const dateStr = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Title
    pdf.setFontSize(20);
    pdf.text("Sound Meter - Daily Report", 105, 20, { align: "center" });

    // Info
    pdf.setFontSize(12);
    pdf.text(`Date: ${dateStr}`, 20, 40);
    if (title) pdf.text(title, 20, 50);

    // Stats
    pdf.setFontSize(14);
    pdf.text("Statistics", 20, 65);
    pdf.setFontSize(12);
    pdf.text(`MIN: ${minDb?.toFixed(1) ?? "--"} dB`, 30, 77);
    pdf.text(`MAX: ${maxDb?.toFixed(1) ?? "--"} dB`, 30, 87);
    pdf.text(`AVG: ${avgDb?.toFixed(1) ?? "--"} dB`, 30, 97);

    // Capture chart if available
    const canvas = document.querySelector(
      "#chart-container canvas"
    ) as HTMLCanvasElement | null;
    if (canvas) {
      const imgData = canvas.toDataURL("image/png");
      pdf.text("Chart", 20, 117);
      pdf.addImage(imgData, "PNG", 20, 125, 170, 80);
    }

    const fileDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    pdf.save(`sound-report-${fileDate}.pdf`);
  }, [title, date, minDb, maxDb, avgDb]);

  return (
    <button
      onClick={exportPdf}
      className="rounded-lg bg-orange-500 hover:bg-orange-400 px-4 py-2 font-semibold text-white transition-colors text-sm"
    >
      Daily Report PDF
    </button>
  );
}
