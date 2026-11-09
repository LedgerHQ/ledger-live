import { useCallback, useMemo } from "react";
import type { Currency } from "@domain/entity-currency";
import type { CounterValuesCacheView } from "@domain/entity-market-countervalues";
import type {
  AccountAnalyticsDataPort,
  AnalyticsPositionSource,
  ReadAnalyticsPortfolio,
} from "../../types";
import { readAnalyticsBalance } from "../../logic/balance/readAnalyticsBalance";

export type AnalyticsBalancePortInput<
  Position extends AnalyticsPositionSource,
  Countervalues extends CounterValuesCacheView,
> = Readonly<{
  positions: readonly Position[];
  countervalues: Countervalues;
  fiat: Currency;
  readPortfolio: ReadAnalyticsPortfolio<Position, Countervalues>;
}>;

export function useAnalyticsBalancePort<
  Position extends AnalyticsPositionSource,
  Countervalues extends CounterValuesCacheView,
>({
  positions,
  countervalues,
  fiat,
  readPortfolio,
}: AnalyticsBalancePortInput<Position, Countervalues>): AccountAnalyticsDataPort {
  const loadBalance = useCallback<AccountAnalyticsDataPort["loadBalance"]>(
    (context, { signal }) => {
      if (signal.aborted) return Promise.resolve({ status: "unavailable" });
      return Promise.resolve(
        readAnalyticsBalance(context, positions, countervalues, fiat, readPortfolio),
      );
    },
    [positions, countervalues, fiat, readPortfolio],
  );
  return useMemo(() => ({ loadBalance }), [loadBalance]);
}
