import { useMemo } from "react";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import {
  useAnalyticsBalancePort,
  type AccountAnalyticsDataPort,
} from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { createReadAnalyticsPortfolio } from "../utils/readAnalyticsPortfolio";

export function useAnalyticsBalanceAdapter(
  positions: readonly AccountLike[],
): AccountAnalyticsDataPort {
  const countervalues = useCountervaluesState();
  const fiat = useSelector(counterValueCurrencySelector);
  const readPortfolio = useMemo(
    () => createReadAnalyticsPortfolio(countervalues, fiat),
    [countervalues, fiat],
  );
  return useAnalyticsBalancePort({ positions, countervalues, fiat, readPortfolio });
}
