import { useCallback, useMemo } from "react";
import type {
  AccountAnalyticsDataPort,
  AnalyticsCountervalueInput,
  AnalyticsPositionSource,
  ReadAnalyticsPortfolio,
} from "../../types";
import { readAnalyticsBalance } from "../../logic/balance/readAnalyticsBalance";

export type AnalyticsBalancePortInput<Position extends AnalyticsPositionSource> =
  AnalyticsCountervalueInput &
    Readonly<{ positions: readonly Position[]; readPortfolio: ReadAnalyticsPortfolio<Position> }>;

const UNAVAILABLE = { status: "unavailable" } as const;

const yieldBeforeSynchronousRead = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export function useAnalyticsBalancePort<Position extends AnalyticsPositionSource>({
  positions,
  countervalues,
  fiat,
  readPortfolio,
}: AnalyticsBalancePortInput<Position>): AccountAnalyticsDataPort {
  const loadBalance = useCallback<AccountAnalyticsDataPort["loadBalance"]>(
    async (context, { signal }) => {
      await yieldBeforeSynchronousRead();
      if (signal.aborted) return UNAVAILABLE;
      return readAnalyticsBalance(context, positions, countervalues, fiat, readPortfolio);
    },
    [positions, countervalues, fiat, readPortfolio],
  );
  return useMemo(() => ({ loadBalance }), [loadBalance]);
}
