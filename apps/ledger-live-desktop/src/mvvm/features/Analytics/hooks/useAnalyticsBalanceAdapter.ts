import { useCountervaluesState } from "@features/platform-market-countervalues";
import {
  useAnalyticsBalancePort,
  type AccountAnalyticsDataPort,
} from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { readAnalyticsPortfolio } from "../utils/readAnalyticsPortfolio";

export function useAnalyticsBalanceAdapter(
  positions: readonly AccountLike[],
): AccountAnalyticsDataPort {
  const countervalues = useCountervaluesState();
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  return useAnalyticsBalancePort({
    positions,
    countervalues,
    fiat: fiatCurrency,
    readPortfolio: readAnalyticsPortfolio,
  });
}
