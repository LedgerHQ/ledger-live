import { getEnv } from "@ledgerhq/live-env";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { GasOptions } from "../../types";

import invariant from "invariant";

//#region Ledger Explorer URL
type LedgerExplorer = {
  version: string;
  id: string;
  endpoint: string;
};

const findCurrencyExplorer = (
  currency: CryptoCurrency
): LedgerExplorer | null | undefined => {
  if (currency.explorerId == null) {
    console.warn("no explorerId for", currency.id);
  }

  return {
    endpoint: getEnv("EXPLORER"),
    id: currency.explorerId ?? currency.id,
    version: "v4",
  };
};

const getCurrencyExplorer = (currency: CryptoCurrency): LedgerExplorer => {
  const res = findCurrencyExplorer(currency);
  invariant(res, `no Ledger explorer for ${currency.id}`);
  return <LedgerExplorer>res;
};

const blockchainBaseURL = (currency: CryptoCurrency): string => {
  const { id, version, endpoint } = getCurrencyExplorer(currency);
  return `${endpoint}/blockchain/${version}/${id}`;
};
//#endregion

export const EIP1559ShouldBeUsed = (currency: CryptoCurrency): boolean => {
  return getEnv("EIP1559_ENABLED_CURRENCIES").includes(currency.id);
};

export const getGasTrackerBarometer: (currency: CryptoCurrency) => Promise<{
  low: BigNumber;
  medium: BigNumber;
  high: BigNumber;
  next_base: BigNumber;
}> = makeLRUCache(
  async (currency: CryptoCurrency) => {
    const baseURL = blockchainBaseURL(currency);

    const { data } = await network({
      method: "GET",
      url: `${baseURL}/gastracker/barometer${
        EIP1559ShouldBeUsed(currency) ? "?display=eip1559" : ""
      }`,
    });
    return {
      low: new BigNumber(data.low),
      medium: new BigNumber(data.medium),
      high: new BigNumber(data.high),
      next_base: new BigNumber(data.next_base),
    };
  },
  (currency) => currency.id,
  {
    ttl: 30 * 1000,
  }
);

export const getGasOptions = async (
  currency: CryptoCurrency
): Promise<GasOptions> => {
  const { low, medium, high, next_base } = await getGasTrackerBarometer(
    currency
  );

  const EIP1559_BASE_FEE_MULTIPLIER: number = getEnv(
    "EIP1559_BASE_FEE_MULTIPLIER"
  );

  if (EIP1559ShouldBeUsed(currency)) {
    return {
      slow: {
        maxFeePerGas: next_base.times(EIP1559_BASE_FEE_MULTIPLIER).plus(low),
        maxPriorityFeePerGas: low,
        gasPrice: null,
      },
      medium: {
        maxFeePerGas: next_base.times(EIP1559_BASE_FEE_MULTIPLIER).plus(medium),
        maxPriorityFeePerGas: medium,
        gasPrice: null,
      },
      fast: {
        maxFeePerGas: next_base.times(EIP1559_BASE_FEE_MULTIPLIER).plus(high),
        maxPriorityFeePerGas: high,
        gasPrice: null,
      },
    };
  }

  return {
    slow: {
      gasPrice: low,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    },
    medium: {
      gasPrice: medium,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    },
    fast: {
      gasPrice: high,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    },
  };
};
