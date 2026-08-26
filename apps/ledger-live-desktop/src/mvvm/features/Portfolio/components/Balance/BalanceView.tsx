import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { cn } from "LLD/utils/cn";
import { BalanceViewProps } from "./types";
import { Trend } from "../Trend";

const showPlaceholder = (balanceAvailable: boolean) => !balanceAvailable;

export const BalanceView = ({
  balance,
  balanceAvailable,
  countervalueComplete,
  formatter,
  discreet,
  valueChange,
  navigateToAnalytics,
  handleKeyDown,
  isLoading,
  theme,
}: BalanceViewProps) => {
  const countervalueTrendComplete =
    countervalueComplete && valueChange.percentage !== null;

  return (
    <button
      type="button"
      className={cn("flex cursor-pointer border-0 bg-transparent p-0 text-inherit", "group")}
      data-testid="portfolio-balance"
      onClick={navigateToAnalytics}
      onKeyDown={handleKeyDown}
      aria-label="View portfolio analytics"
    >
      <span
        className={cn(
          "flex items-baseline gap-12 transition-[filter,opacity] duration-200",
          theme === "light" && "group-hover:opacity-85",
          theme === "dark" && "group-hover:brightness-85",
        )}
      >
        {showPlaceholder(balanceAvailable) ? (
          <Skeleton data-testid="portfolio-placeholder-balance" className="h-48 w-256 rounded-md" />
        ) : !countervalueComplete ? (
          <span
            className="heading-1-semi-bold text-base"
            data-testid="portfolio-unavailable-balance"
          >
            -
          </span>
        ) : (
          <AmountDisplay
            value={balance}
            formatter={formatter}
            hidden={discreet}
            animate
            loading={isLoading}
            data-testid="portfolio-total-balance"
          />
        )}
        {balanceAvailable &&
          (countervalueTrendComplete ? (
            <Trend valueChange={valueChange} />
          ) : (
            <span className="body-2 text-muted" data-testid="portfolio-unavailable-trend">
              -
            </span>
          ))}
      </span>
    </button>
  );
};
