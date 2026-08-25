import React from "react";

type PerformanceIndicatorProps = {
  value: {
    priceChangePercentage24h: number | null | undefined;
  };
};

export const PerformanceIndicator = ({ value }: PerformanceIndicatorProps) => {
  const priceChangePercentage24h = value.priceChangePercentage24h;

  if (
  priceChangePercentage24h === null ||
  priceChangePercentage24h === undefined
) {
  return <div className="body-3">--</div>;
}

  const textColorClass = priceChangePercentage24h >= 0 ? "text-success" : "text-error";

  return (
    <div className={`${textColorClass} body-3`}>
      {priceChangePercentage24h >= 0 ? "+" : ""}
      {priceChangePercentage24h.toFixed(2)}%
    </div>
  );
};