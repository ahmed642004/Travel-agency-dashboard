import React from "react";
import { calculateTrendPercentage, cn } from "~/lib/utils";
import Chart from "~/components/Chart";

const StatsCard = ({
  headerTitle,
  total,
  currentMonthCount,
  lastMonthCount,
}: StatsCard) => {
  const { trend, percentage } = calculateTrendPercentage(
    currentMonthCount,
    lastMonthCount,
  );
  // console.log(headerTitle, total, currentMonthCount, lastMonthCount, trend);
  const isDecrement = trend === "decrement";
  return (
    <article className="stats-card">
      <h3 className="text-base font-medium">{headerTitle}</h3>
      <div className="content flex items-center justify-between gap-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-4xl font-semibold">{total}</h2>
          <div className="flex items-center gap-2">
            <figure className="flex items-center gap-1">
              <img
                src={`assets/icons/${isDecrement ? "arrow-down-red.svg" : "arrow-up-green.svg"}`}
                alt="arrow"
                className="size-5"
              />
              <figcaption
                className={cn(
                  "text-sm font-medium",
                  isDecrement ? "text-red-500" : "text-success-700",
                )}
              >
                {Math.round(percentage)}%
              </figcaption>
            </figure>
            <p className="font-medium text-sm text-gray-100 truncate">
              Vs last month
            </p>
          </div>
        </div>
        <Chart
          currentMonthCount={currentMonthCount}
          lastMonthCount={lastMonthCount}
        />
      </div>
    </article>
  );
};
export default StatsCard;
