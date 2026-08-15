import { getGasTracker } from "@ledgerhq/coin-evm/network/gasTracker/index";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { Transaction } from "./types";
import type { GasOptions } from "@ledgerhq/coin-evm/types/index";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useEffect, useMemo, useState } from "react";
import { getCurrencyConfiguration } from "../../config";

/**
 * React hook to get gas options for a given currency
 * Used in the send flow to get the gas options for the currency,
 * for example in SelectFeeStrategy.tsx file in the renderer/families/{currency} folder in LLD
 */
export const useGasOptions = ({
  currency,
  transaction,
  // interval is the time in milliseconds between each call to the gas tracker
  interval = 60 * 1000,
}: {
  currency: CryptoCurrency;
  transaction: Transaction;
  interval?: number;
}): [GasOptions | undefined, Error | null, boolean] => {
  const shouldUseEip1559 = transaction.type === 2;
  const config = useMemo(() => getCurrencyConfiguration<EvmConfigInfo>(currency.id), [currency]);
  const gasTracker = useMemo(() => getGasTracker(config), [config]);
  const [error, setError] = useState<Error | null>(null);
  const [gasOptions, setGasOptions] = useState<GasOptions | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gasTracker) {
      setLoading(false);
      return;
    }

    const getGasOptionsCallback = async () =>
      gasTracker
        .getGasOptions({
          currencyId: currency.id,
          config,
          options: { useEIP1559: shouldUseEip1559 },
        })
        .then(setGasOptions)
        .catch(setError)
        .finally(() => setLoading(false));

    getGasOptionsCallback();
    if (interval > 0) {
      const intervalId = setInterval(() => getGasOptionsCallback(), interval);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [gasTracker, interval, currency, config, shouldUseEip1559]);

  return [gasOptions, error, loading];
};
