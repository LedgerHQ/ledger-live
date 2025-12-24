import React from "react";
import { cva } from "class-variance-authority";
import { useMarketIndicator } from "../useMarketIndicator";

const percentStyles = cva("rounded-sm px-4 py-2", {
  variants: {
    variant: {
      positive: "bg-success text-success",
      negative: "text-error",
      neutral: "",
    },
  },
  defaultVariants: {
    variant: "neutral",
  },
});

export const MarketPercentIndicator = ({ percent }: { percent: number }) => {
  const { variant, percentText } = useMarketIndicator(percent);

  return (
    <div data-testid="market-percent-indicator" className="flex w-fit flex-col items-end">
      <span data-testid="market-percent-indicator-value" className={percentStyles({ variant })}>
        {percentText}
      </span>
    </div>
  );
};
