import type { Currency } from "@domain/entity-currency";
import type { BigNumber } from "bignumber.js";
import { useMemo } from "react";
import { useCalculateCountervalueCallback } from "./countervaluesHooks";

export type FiatValueEntry = { currency: Currency; value: BigNumber };

/**
 * Sorts `items` by countervalue in `to`, highest first. Items without a countervalue count as 0 and
 * ties keep their input order.
 */
export function useSortByFiatValue<T>(
  items: readonly T[],
  getEntry: (item: T) => FiatValueEntry,
  to: Currency,
): T[] {
  const calculateCountervalue = useCalculateCountervalueCallback({ to });
  return useMemo(() => {
    const valued = items.map(item => {
      const { currency, value } = getEntry(item);
      const fiat = calculateCountervalue(currency, value);
      return { item, fiat: fiat?.toNumber() ?? 0 };
    });
    return valued.sort((a, b) => b.fiat - a.fiat).map(({ item }) => item);
  }, [items, getEntry, calculateCountervalue]);
}
