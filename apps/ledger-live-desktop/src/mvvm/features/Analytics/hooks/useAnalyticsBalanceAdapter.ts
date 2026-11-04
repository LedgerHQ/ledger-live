import { useCallback, useMemo } from "react";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import type { AccountAnalyticsDataPort } from "@features/flow-account-analytics";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { readAnalyticsBalance } from "../utils/readAnalyticsBalance";

export function useAnalyticsBalanceAdapter(
  positions: readonly AccountLike[],
): AccountAnalyticsDataPort {
  const countervalues = useCountervaluesState();
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const loadBalance = useCallback<AccountAnalyticsDataPort["loadBalance"]>(
    (context, { signal }) => {
      if (signal.aborted) return Promise.resolve({ status: "unavailable" });
      return Promise.resolve(readAnalyticsBalance(context, positions, countervalues, fiatCurrency));
    },
    [positions, countervalues, fiatCurrency],
  );
  return useMemo(() => ({ loadBalance }), [loadBalance]);
}
