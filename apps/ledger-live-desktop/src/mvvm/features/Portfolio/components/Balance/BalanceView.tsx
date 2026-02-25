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
}: BalanceViewProps) => {
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
      <AmountDisplay
        value={balance}
        formatter={formatter}
        hidden={discreet}
        data-testid="portfolio-total-balance"
      />
      <Trend valueChange={valueChange} />
    </div>
  );
};
