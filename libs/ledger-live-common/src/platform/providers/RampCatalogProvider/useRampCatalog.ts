import { useCallback } from "react";
import { getCryptoCurrencyIds, isCurrencyInCatalog } from "./helpers";
import { useRampCatalogContext } from "./index";
import type { CryptoCurrency } from "@ledgerhq/wallet-api-core/lib/currencies/types";
import { CryptoCurrencyId, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type UseRampCatalog = {
  isCurrencyAvailable: (
    currencyId: CryptoCurrency["id"] | string,
    mode: "onRamp" | "offRamp",
  ) => boolean;
  getSupportedCryptoCurrencyIds: (mode: "onRamp" | "offRamp") => CryptoCurrency["id"][] | null;
};

export function useRampCatalog(): UseRampCatalog {
  const state = useRampCatalogContext();

  /** @param mode "onRamp" for can buy, "offRamp" for can sell. */
  const getSupportedCryptoCurrencyIds = useCallback(
    (mode: "onRamp" | "offRamp") => {
      if (!state.value) {
        return null;
      }
      return getCryptoCurrencyIds(state.value[mode]);
    },
    [state.value],
  );

  /** @param mode "onRamp" for can buy, "offRamp" for can sell.
   * @returns true if the currency is supported, false if not, null if the catalog is not loaded yet.
   */
  const isCurrencyAvailable = useCallback(
    (
      currencyId: CryptoCurrency["id"] | CryptoCurrencyId | CryptoOrTokenCurrency["id"],
      mode: "onRamp" | "offRamp",
    ) => {
      if (!state.value) {
        return false;
      }
      return isCurrencyInCatalog(currencyId, state.value, mode);
    },
    [state.value],
  );

  return {
    getSupportedCryptoCurrencyIds,
    isCurrencyAvailable,
  };
}
