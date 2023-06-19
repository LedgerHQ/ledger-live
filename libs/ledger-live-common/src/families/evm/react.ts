import { getGasTracker } from "@ledgerhq/coin-evm/api/gasTracker/index";
import type { GasOptions, Transaction } from "@ledgerhq/coin-evm/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { useEffect, useState } from "react";

type ReturnType = GasOptions | Error | null;

/**
 * React hook to get gas options for a given currency
 * Used in the send flow to get the gas options for the currency,
 * for example in SelectFeeStrategy.tsx file in the renderer/families/{currency} folder in LLD
 */
export const useGasOptions = ({
  currency,
  transaction,
  interval,
}: {
  currency: CryptoCurrency;
  transaction: Transaction;
  interval?: number;
}): ReturnType => {
  const [gasOptions, setGasOptions] = useState<GasOptions | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const gasTracker = getGasTracker(currency);

  const shouldUseEip1559 = transaction.type === 2;

  useEffect(() => {
    if (!gasTracker) {
      return;
    }

    const getGasOptionsCallback = async () =>
      gasTracker
        .getGasOptions({ currency, options: { useEIP1559: shouldUseEip1559 } })
        .then(setGasOptions)
        .catch(setError);

    if (!interval) {
      getGasOptionsCallback();
      return;
    }

    const intervalId = setInterval(() => getGasOptionsCallback, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [gasTracker, interval, currency, shouldUseEip1559]);

  return gasOptions ?? error;
};
