import { useMemo } from "react";
import { listAndFilterCurrencies } from "./helpers";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { CurrencyFilters } from "../platform/filters";

export function useFilteredCurrencies({
  includeTokens,
  currencies,
}: CurrencyFilters): Currency[] {
  return useMemo(() => {
    return listAndFilterCurrencies({
      includeTokens,
      currencies,
    });
  }, [currencies, includeTokens]);
}
