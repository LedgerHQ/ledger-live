import { useCallback } from "react";
import { useSelector } from "~/context/store";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { currencySettingsSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

/**
 * Hook to get currency settings for a currency.
 *
 * @param currency
 * The currency to get settings for.
 *
 * @returns
 * The currency settings.
 */
export function useCurrencySettings(currency: CryptoCurrency | TokenCurrency) {
  const selector = useCallback(
    (state: State) => currencySettingsSelector(state.settings, { currency }),
    [currency],
  );
  return useSelector(selector);
}
