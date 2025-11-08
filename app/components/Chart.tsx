import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export type ChartProps = {
  currentMonthCount: number;
  lastMonthCount: number;
  labels?: string[]; // optional custom labels for [last, mid, current]
  showXAxisLabels?: boolean; // whether to show x-axis labels (endpoints only)
  showTooltip?: boolean; // whether to show tooltip (uses labels)
};

const Chart: React.FC<ChartProps> = ({
  currentMonthCount,
  lastMonthCount,
  labels: labelsProp,
  showXAxisLabels = false,
  showTooltip = true,
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  // Build a hidden midpoint to encourage a curve between two values
  const diff = currentMonthCount - lastMonthCount;
  const midBase = lastMonthCount + diff / 2;
  const curveFactor = 0.2; // adjust 0.05..0.35 for more/less bend
  const middlePoint =
    diff >= 0
      ? midBase - Math.abs(diff) * curveFactor
      : midBase + Math.abs(diff) * curveFactor;

  const isDecrement = currentMonthCount < lastMonthCount;

  // Resolve labels to use
  const labels: string[] =
    Array.isArray(labelsProp) && labelsProp.length === 3
      ? labelsProp
      : ["Last month", "Mid", "Current month"];

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        enabled: showTooltip,
        callbacks: {
          title: (items) => (items?.length ? labels[items[0].dataIndex] : ""),
        },
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 4,
      },
      line: {
        borderWidth: 2,
      },
    },
    scales: {
      x: {
        display: showXAxisLabels,
        grid: { display: false },
        border: { display: false },
        ticks: showXAxisLabels
          ? {
              maxRotation: 0,
              autoSkip: false,
              callback: (_value, index) =>
                index === 1 ? "" : (labels[index] ?? ""),
            }
          : undefined,
      },
      y: {
        display: false,
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "",
        data: [lastMonthCount, middlePoint, currentMonthCount],
        borderColor: isDecrement ? "rgb(239,68,68)" : "rgb(22,163,74)",
        backgroundColor: isDecrement
          ? "rgba(239,68,68,0.12)"
          : "rgba(22,163,74,0.12)",
        pointRadius: (ctx) => (ctx.dataIndex === 1 ? 0 : 3),
        pointHoverRadius: (ctx) => (ctx.dataIndex === 1 ? 0 : 4),
        tension: 0.45,
        fill: true,
      },
    ],
  };

  return (
    <div style={{ width: 160, height: 80 }}>
      {mounted ? <Line options={options} data={data} /> : null}
    </div>
  );
};

export default Chart;
