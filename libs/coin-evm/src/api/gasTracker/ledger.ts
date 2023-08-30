import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { CryptoCurrency, LedgerExplorerId } from "@ledgerhq/types-cryptoassets";
import { GasTrackerApi, isLedgerGasTracker } from "./types";
import { GasOptions } from "../../types";
import { LedgerGasTrackerUsedIncorrectly, NoGasTrackerFound } from "../../errors";

type GasTracker = {
  compatibilty: {
    eip1559: boolean;
  };
};

// FIXME: how to know if a Ledger gasTracker supports EIP1559?
// Shouldn't this be a dynamic / remote config? For example if there is an
// update of the explorer backend to support EIP1559, we should be able to
// update this config without having to release a new version of the app?
const explorerIdGasTrackerMap = new Map<LedgerExplorerId, GasTracker>([
  ["avax", { compatibilty: { eip1559: false } }],
  ["bnb", { compatibilty: { eip1559: false } }],
  ["eth", { compatibilty: { eip1559: true } }],
  ["etc", { compatibilty: { eip1559: false } }],
  ["matic", { compatibilty: { eip1559: true } }],
  ["eth_ropsten", { compatibilty: { eip1559: true } }],
  ["eth_goerli", { compatibilty: { eip1559: true } }],
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
  const { gasTracker } = currency.ethereumLikeInfo || /* istanbul ignore next */ {};
  if (!isLedgerGasTracker(gasTracker)) {
    throw new LedgerGasTrackerUsedIncorrectly();
  }

  const gasTrackerConfig = explorerIdGasTrackerMap.get(gasTracker.explorerId);
  if (!gasTrackerConfig) {
    throw new NoGasTrackerFound(`No gas tracker found for ${currency.id}`);
  }

  // We use the eip1559 display parameter only if requested AND the currency supports it
  const useEIP1559 = options?.useEIP1559 && gasTrackerConfig.compatibilty.eip1559;

  const { low, medium, high, next_base } = await network({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${gasTracker.explorerId}/gastracker/barometer${
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
        nextBaseFee: next_base,
      },
      medium: {
        maxFeePerGas: next_base.times(EIP1559_BASE_FEE_MULTIPLIER).plus(medium),
        maxPriorityFeePerGas: medium,
        gasPrice: null,
        nextBaseFee: next_base,
      },
      fast: {
        maxFeePerGas: next_base.times(EIP1559_BASE_FEE_MULTIPLIER).plus(high),
        maxPriorityFeePerGas: high,
        gasPrice: null,
        nextBaseFee: next_base,
      },
    };
  }

  return {
    slow: {
      gasPrice: low,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    },
    medium: {
      gasPrice: medium,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    },
    fast: {
      gasPrice: high,
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
      nextBaseFee: null,
    },
  };
};

const gasTracker: GasTrackerApi = {
  getGasOptions,
};

export default gasTracker;
