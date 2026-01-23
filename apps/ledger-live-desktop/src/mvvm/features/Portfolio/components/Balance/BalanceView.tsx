import React, { useCallback, useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector, discreetModeSelector } from "~/renderer/reducers/settings";
import { formatBalanceParts } from "../../utils/formatBalanceParts";
import { BalanceViewProps } from "./types";
import { Trend } from "../Trend";

export const BalanceView = ({
  totalBalance,
  valueChange,
  unit,
  isAvailable,
  isFiat,
  navigateToAnalytics,
}: BalanceViewProps) => {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const { integerPart, decimalSeparator, decimalDigits } = useMemo(
    () => formatBalanceParts({ unit, balance: totalBalance, locale, discreet, isFiat }),
    [unit, totalBalance, locale, discreet, isFiat],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigateToAnalytics();
      }
    },
    [navigateToAnalytics],
  );

  if (!isAvailable) {
    return null;
  }

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
