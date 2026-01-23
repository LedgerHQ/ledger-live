import React, { useMemo } from "react";
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
  currencyTicker,
}: BalanceViewProps) => {
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const { integerPart, decimalSeparator, decimalDigits } = useMemo(
    () => formatBalanceParts({ unit, balance: totalBalance, locale, discreet, currencyTicker }),
    [unit, totalBalance, locale, discreet, currencyTicker],
  );

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="flex items-baseline gap-12" data-testid="portfolio-balance">
      <div className="flex items-baseline gap-2" data-testid="portfolio-total-balance">
        <span className="heading-1-semi-bold text-base">{integerPart}</span>
        <span className="heading-2-semi-bold text-muted">{decimalSeparator}</span>
        <span className="heading-2-semi-bold text-muted">{decimalDigits}</span>
      </div>
      <Trend valueChange={valueChange} />
    </div>
  );
};
