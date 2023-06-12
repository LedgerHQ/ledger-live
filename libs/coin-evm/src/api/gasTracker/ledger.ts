import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import { GasOptions } from "../../types";
import { GasTrackerDoesNotSupportEIP1559, NoGasTrackerFound } from "../../errors";

type GasTracker = {
  explorerId: string;
  compatibilty: {
    eip1559: boolean;
  };
};

// FIXME: how to know if a Ledger gasTracker supports EIP1559?
// Shouldn't this be a dynamic / remote config? For example if there is an
// update of the explorer backend to support EIP1559, we should be able to
// update this config without having to release a new version of the app?
const currencyIdGasTrackerMap = new Map<CryptoCurrency["id"], GasTracker>([
  ["avalanche_c_chain", { explorerId: "avax", compatibilty: { eip1559: false } }],
  ["bsc", { explorerId: "bnb", compatibilty: { eip1559: false } }],
  ["ethereum", { explorerId: "eth", compatibilty: { eip1559: true } }],
  ["ethereum_classic", { explorerId: "etc", compatibilty: { eip1559: false } }],
  ["polygon", { explorerId: "matic", compatibilty: { eip1559: true } }],
  ["ethereum_ropsten", { explorerId: "eth_ropsten", compatibilty: { eip1559: true } }],
  ["ethereum_goerli", { explorerId: "eth_goerli", compatibilty: { eip1559: true } }],
]);

export const getGasOptions = async ({
  currency,
  options,
}: {
  currency: CryptoCurrency;
  options?: {
    useEIP1559: boolean;
  };
}): Promise<GasOptions> => {
  const gasTrackerConfig = currencyIdGasTrackerMap.get(currency.id);

  if (!gasTrackerConfig) {
    throw new NoGasTrackerFound(`No gas tracker found for ${currency.id}`);
  }

  const { useEIP1559 = false } = options || {};

  if (useEIP1559 && !gasTrackerConfig.compatibilty.eip1559) {
    throw new GasTrackerDoesNotSupportEIP1559(
      `Gas tracker does not support EIP1559 for ${currency.id}`,
    );
  }

  const { low, medium, high, next_base } = await network({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${gasTrackerConfig.explorerId}/gastracker/barometer${
      useEIP1559 ? "?display=eip1559" : ""
    }`,
  }).then(({ data }) => ({
    low: new BigNumber(data.low),
    medium: new BigNumber(data.medium),
    high: new BigNumber(data.high),
    next_base: new BigNumber(data.next_base),
  }));

  const EIP1559_BASE_FEE_MULTIPLIER: number = getEnv("EIP1559_BASE_FEE_MULTIPLIER");

  if (useEIP1559) {
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
