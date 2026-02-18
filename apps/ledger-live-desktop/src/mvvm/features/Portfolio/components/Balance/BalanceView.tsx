import React from "react";
import { AmountDisplay } from "@ledgerhq/lumen-ui-react";
import { BalanceViewProps } from "./types";
import { Trend } from "../Trend";

export const BalanceView = ({
  balance,
  formatter,
  discreet,
  valueChange,
  navigateToAnalytics,
  handleKeyDown,
  isColdStart,
  shouldDisplayBalanceRefreshRework,
}: BalanceViewProps) => {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-baseline gap-12 border-0 bg-transparent p-0 text-inherit"
      data-testid="portfolio-balance"
      onClick={navigateToAnalytics}
      onKeyDown={handleKeyDown}
      aria-label="View portfolio analytics"
    >
      <AmountDisplay
        value={balance}
        formatter={formatter}
        hidden={discreet}
        animate={shouldDisplayBalanceRefreshRework}
        loading={shouldDisplayBalanceRefreshRework && isColdStart}
        data-testid="portfolio-total-balance"
      />
      {!isColdStart && <Trend valueChange={valueChange} />}
    </button>
  );
};
