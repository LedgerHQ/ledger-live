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
  interval,
}: {
  currency: CryptoCurrency;
  interval?: number;
}): GasOptions | null | undefined => {
  const [gasOptions, setGasOptions] = useState<GasOptions | null | undefined>(
    null
  );
  const gasTracker = getGasTracker(currency);

  useEffect(() => {
    if (!interval) {
      gasTracker.getGasOptions(currency).then(setGasOptions);
      return;
    }

    const intervalId = setInterval(() => {
      gasTracker.getGasOptions(currency).then(setGasOptions);
    }, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [gasTracker, interval, currency]);

  return gasOptions;
};
