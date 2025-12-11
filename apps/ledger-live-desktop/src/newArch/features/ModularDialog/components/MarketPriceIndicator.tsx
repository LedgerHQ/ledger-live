import React from "react";

const getPercentageDisplay = (percent: number) => {
  if (percent > 0) {
    return {
      className: "text-success",
      text: `+${percent}%`,
    };
  }
  if (percent < 0) {
    return {
      className: "text-error",
      text: `-${Math.abs(percent)}%`,
    };
  }
  return {
    className: "text-muted",
    text: `${percent}%`,
  };
};

export const MarketPriceIndicator = ({ percent, price }: { percent: number; price: string }) => {
  const percentageDisplay = getPercentageDisplay(percent);

  return (
    <div data-testid="market-price-indicator" className="flex flex-col items-end">
      <span data-testid="market-price-indicator-value" className="body-2-semi-bold">
        {price}
      </span>
      <span
        data-testid="market-price-indicator-percent"
        className={`body-3 ${percentageDisplay.className}`}
      >
        {percentageDisplay.text}
      </span>
    </div>
  );
};
