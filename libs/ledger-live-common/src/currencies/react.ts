import { useMemo } from "react";
import { listTokens, listSupportedCurrencies } from "../currencies";
import { Currency } from "../types";

export function useCurrencies(includeTokens = true): Currency[] {
  return useMemo(() => {
    const currencies = listSupportedCurrencies();

    if (!includeTokens) {
      return currencies;
    }

    const allTokens = listTokens().filter(
      ({ tokenType }) => tokenType === "erc20" || tokenType === "bep20"
    );

    return [...currencies, ...allTokens];
  }, [includeTokens]);
}
