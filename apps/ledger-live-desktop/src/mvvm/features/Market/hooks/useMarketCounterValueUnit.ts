import { useMemo } from "react";
import type { Unit } from "@domain/entity-currency-unit";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector, possibleIntermediaries } from "~/renderer/reducers/settings";

export function resolveMarketCounterValueUnit(
  counterCurrency: string | undefined,
  fallbackUnit: Unit,
): Unit {
  const ticker = counterCurrency?.toUpperCase();
  if (!ticker) return fallbackUnit;

  // Crypto counter values first: Settings stores BTC/ETH as crypto currencies, while the
  // fiat registry also has a "BTC" entry with a different symbol ("₿" instead of "BTC").
  const intermediary = possibleIntermediaries.find(currency => currency.ticker === ticker);
  if (intermediary) return intermediary.units[0];

  return findFiatCurrencyByTicker(ticker)?.units[0] ?? fallbackUnit;
}

export function useMarketCounterValueUnit(counterCurrency: string | undefined): Unit {
  const settingsUnit = useSelector(counterValueCurrencySelector).units[0];
  return useMemo(
    () => resolveMarketCounterValueUnit(counterCurrency, settingsUnit),
    [counterCurrency, settingsUnit],
  );
}
