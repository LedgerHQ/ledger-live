import React from "react";
import { BalanceViewProps } from "./types";
import { Trend } from "../Trend";

export const BalanceView = ({
  balanceParts,
  valueChange,
  isAvailable,
  navigateToAnalytics,
  handleKeyDown,
}: BalanceViewProps) => {
  if (!isAvailable) {
    return null;
  }

  const { integerPart, decimalSeparator, decimalDigits } = balanceParts;

  return (
    <div
      className="flex cursor-pointer items-baseline gap-12"
      data-testid="portfolio-balance"
      role="button"
      tabIndex={0}
      onClick={navigateToAnalytics}
      onKeyDown={handleKeyDown}
      aria-label="View portfolio analytics"
    >
      <div className="flex items-baseline gap-2" data-testid="portfolio-total-balance">
        <span className="heading-1-semi-bold text-base">{integerPart}</span>
        <span className="heading-2-semi-bold text-muted">{decimalSeparator}</span>
        <span className="heading-2-semi-bold text-muted">{decimalDigits}</span>
      </div>
      <Trend valueChange={valueChange} />
    </div>
  );
};
