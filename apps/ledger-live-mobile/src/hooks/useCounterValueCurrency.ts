import { useSelector } from "react-redux";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { counterValueCurrencyTickerSelector } from "../reducers/settings";

/**
 * Hook to get the counter value currency synchronously.
 * Returns the resolved Currency or null if not found.
 */
export function useCounterValueCurrency(): Currency | null {
  const ticker = useSelector(counterValueCurrencyTickerSelector);

  try {
    return getFiatCurrencyByTicker(ticker);
  } catch (error) {
    // If the ticker is not found, return null
    // The calling components already handle null values appropriately
    return null;
  }
}

export default useCounterValueCurrency;
