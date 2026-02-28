"use client";

import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface Props {
  labels: string[];
  data: number[];
}

export default function DbChart({ labels, data }: Props) {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-xl p-2" id="chart-container">
      <Line
        ref={chartRef}
        data={{
          labels,
          datasets: [
            {
              label: "dB Level",
              data,
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              pointRadius: 0,
              fill: true,
              tension: 0.1,
            },
          ],
        }}
        options={{
          responsive: true,
          animation: false,
          scales: {
            y: { min: 0, max: 120, title: { display: true, text: "dB" } },
            x: {
              ticks: {
                maxTicksLimit: 10,
                maxRotation: 0,
              },
            },
          },
          plugins: {
            tooltip: { mode: "index", intersect: false },
          },
        }}
      />
    </div>
  );
}
