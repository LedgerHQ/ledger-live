import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector, hasAccountsSelector } from "~/renderer/reducers/accounts";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { usePortfolioThrottled } from "@ledgerhq/live-countervalues-react/portfolio";
import { DEFAULT_PORTFOLIO_RANGE } from "LLD/utils/constants";

export interface UsePortfolioSyncStatusOptions {
  /** When true, use the user's selected time range instead of DEFAULT_PORTFOLIO_RANGE (e.g. for legacy Portfolio views). */
  readonly legacyRange?: boolean;
}

/**
 * Shared hook for portfolio + countervalue sync status used by Balance (cold start loading)
 * and TopBar activity indicator (cold start rotation).
 * Uses throttled portfolio computation and returns isColdStart.
 */
export function usePortfolioSyncStatus(options: UsePortfolioSyncStatusOptions = {}) {
  const { legacyRange = false } = options;
  const accounts = useSelector(accountsSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const hasAccounts = useSelector(hasAccountsSelector);
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const range = legacyRange ? selectedTimeRange : DEFAULT_PORTFOLIO_RANGE;

  const portfolio = usePortfolioThrottled({
    accounts,
    range,
    to: counterValue,
  });

  const balanceAvailable = portfolio.balanceAvailable;
  const isColdStart = hasAccounts && !balanceAvailable;

  return useMemo(
    () => ({
      portfolio,
      counterValue,
      isColdStart,
    }),
    [portfolio, counterValue, isColdStart],
  );
}
