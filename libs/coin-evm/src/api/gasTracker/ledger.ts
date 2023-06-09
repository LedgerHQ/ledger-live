import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { GasOptions } from "../../types";
import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import invariant from "invariant";

const currencyExplorerMap = new Map<CryptoCurrency["id"], string>();

for (const currency of Object.values(cryptocurrenciesById)) {
  currencyExplorerMap.set(currency.id, currency.explorerId ?? currency.id);
}

const buildExplorerURL = (currency: CryptoCurrency): string => {
  const explorerId = currencyExplorerMap.get(currency.id);

  invariant(explorerId, "unknown " + currency.id);

  const endpoint = getEnv("EXPLORER");
  const id = explorerId;
  const version = "v4";

  return `${endpoint}/blockchain/${version}/${id}`;
};

export const getGasOptions = async ({
  currency,
  shouldUseEip1559,
}: {
  currency: CryptoCurrency;
  shouldUseEip1559: boolean;
}): Promise<GasOptions> => {
  const baseURL = buildExplorerURL(currency);

  const { low, medium, high, next_base } = await network({
    method: "GET",
    url: `${baseURL}/gastracker/barometer${
      shouldUseEip1559 ? "?display=eip1559" : ""
    }`,
  }).then(({ data }) => ({
    low: new BigNumber(data.low),
    medium: new BigNumber(data.medium),
    high: new BigNumber(data.high),
    next_base: new BigNumber(data.next_base),
  }));

  const EIP1559_BASE_FEE_MULTIPLIER: number = getEnv(
    "EIP1559_BASE_FEE_MULTIPLIER"
  );

  if (shouldUseEip1559) {
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
