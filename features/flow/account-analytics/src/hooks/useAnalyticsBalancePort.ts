import { useCallback, useMemo } from "react";
import type { AccountAnalyticsDataPort, AnalyticsPositionSource } from "../types";
import {
  readAnalyticsBalance,
  type ReadAnalyticsBalanceInput,
} from "../logic/readAnalyticsBalance";

const UNAVAILABLE = { status: "unavailable" } as const;

/** Yields one task before the synchronous portfolio read, so a closing sheet paints and a newer selection can abort it. */
const yieldToRenderer = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export function useAnalyticsBalancePort<Position extends AnalyticsPositionSource>({
  positions,
  countervalues,
  fiat,
  readPortfolio,
}: ReadAnalyticsBalanceInput<Position>): AccountAnalyticsDataPort {
  const loadBalance = useCallback<AccountAnalyticsDataPort["loadBalance"]>(
    async (context, { signal }) => {
      await yieldToRenderer();
      if (signal.aborted) return UNAVAILABLE;
      return readAnalyticsBalance(context, { positions, countervalues, fiat, readPortfolio });
    },
    [positions, countervalues, fiat, readPortfolio],
  );
  return useMemo(() => ({ loadBalance }), [loadBalance]);
}
