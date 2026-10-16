import { getGasTracker } from "@ledgerhq/coin-evm/network";
import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { Transaction } from "./types";
import type { GasOptions } from "@ledgerhq/coin-evm/types";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { useEffect, useMemo, useState } from "react";
import { getCurrencyConfiguration } from "../../config";
import { isPortfolioEnabledFor } from "../../bridge/generic-coin-framework/portfolio/config";
import { networkGasOptions } from "./editTransaction/gasOptions";

type GasOptionsSource = {
  getGasOptions: (request: {
    config: EvmConfigInfo;
    options: { useEIP1559: boolean };
  }) => Promise<GasOptions>;
};

/**
 * Where the gas options of a currency come from: its portfolio when its coin config enables it (a
 * fee estimate carrying them), the gas tracker of the coin module's network otherwise. None when
 * the currency configures no gas tracker.
 */
function gasOptionsSourceOf(
  currency: CryptoCurrency,
  config: EvmConfigInfo,
): GasOptionsSource | null {
  if (!isPortfolioEnabledFor(currency.id)) return getGasTracker(config);
  if (!config.gasTracker) return null;
  return {
    getGasOptions: async ({ options }) => {
      const gasOptions = await networkGasOptions(currency, options.useEIP1559);
      if (!gasOptions) throw new Error(`No gas tracker found for currency ${currency.id}`);
      return gasOptions;
    },
  };
}

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
  const gasTracker = useMemo(() => gasOptionsSourceOf(currency, config), [currency, config]);
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
