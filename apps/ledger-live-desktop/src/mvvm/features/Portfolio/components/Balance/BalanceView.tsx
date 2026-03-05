import React from "react";
import { AmountDisplay, Skeleton } from "@ledgerhq/lumen-ui-react";
import { useSelector } from "LLD/hooks/redux";
import { cn } from "LLD/utils/cn";
import { themeSelector } from "~/renderer/actions/general";
import { BalanceViewProps } from "./types";
import { Trend } from "../Trend";

const showPlaceholder = (balance: number, balanceAvailable: boolean) =>
  balance === 0 && !balanceAvailable;

export const BalanceView = ({
  balance,
  balanceAvailable,
  formatter,
  discreet,
  valueChange,
  navigateToAnalytics,
  handleKeyDown,
  isLoading,
  isColdStart,
  shouldDisplayBalanceRefreshRework,
}: BalanceViewProps) => {
  const theme = useSelector(themeSelector);

  return (
    <button
      type="button"
      className={cn(
        "flex cursor-pointer border-0 bg-transparent p-0 text-inherit",
        shouldDisplayBalanceRefreshRework && "group",
      )}
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
        {showPlaceholder(balance, balanceAvailable) ? (
          <Skeleton data-testid="portfolio-placeholder-balance" className="h-48 w-256 rounded-md" />
        ) : (
          <AmountDisplay
            value={balance}
            formatter={formatter}
            hidden={discreet}
            animate={shouldDisplayBalanceRefreshRework}
            loading={shouldDisplayBalanceRefreshRework && isLoading}
            data-testid="portfolio-total-balance"
          />
        )}
        {!isColdStart && <Trend valueChange={valueChange} />}
      </span>
    </button>
  );
};
