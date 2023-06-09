import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import type { GasOptions } from "@ledgerhq/coin-evm/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useState } from "react";

/**
 *
 * React hook to get gas options for a given currency
 * Used in the send flow to get the gas options for the currency,
 * for example in SelectFeeStrategy.tsx file in the renderer/families/{currency} folder in LLD
 */
export const useGasOptions = ({
  currency,
  shouldUseEip1559,
  interval,
}: {
  currency: CryptoCurrency;
  shouldUseEip1559: boolean;
  interval?: number;
}): GasOptions | null => {
  const [gasOptions, setGasOptions] = useState<GasOptions | null>(null);
  const gasTracker = getGasTracker(currency);

  useEffect(() => {
    if (!gasTracker) {
      return;
    }

    if (!interval) {
      gasTracker
        .getGasOptions({ currency, shouldUseEip1559 })
        .then(setGasOptions);
      return;
    }

    const intervalId = setInterval(() => {
      gasTracker
        .getGasOptions({ currency, shouldUseEip1559 })
        .then(setGasOptions);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [gasTracker, interval, currency, shouldUseEip1559]);

  return gasOptions;
};
