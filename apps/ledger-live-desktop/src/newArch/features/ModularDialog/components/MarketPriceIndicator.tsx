import React from "react";
import { cva } from "class-variance-authority";
import { useMarketPriceIndicator } from "../hooks/useMarketPriceIndicator";

const percentStyles = cva("body-3", {
  variants: {
    variant: {
      positive: "text-success",
      negative: "text-error",
      neutral: "text-muted",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export const MarketPriceIndicator = ({ percent, price }: { percent: number; price: string }) => {
  const { variant, percentText } = useMarketPriceIndicator(percent);

  return (
    <div data-testid="market-price-indicator" className="flex flex-col items-end">
      <span data-testid="market-price-indicator-value" className="body-2-semi-bold">
        {price}
      </span>
      <span data-testid="market-price-indicator-percent" className={percentStyles({ variant })}>
        {percentText}
      </span>
    </div>
  );
};
