import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiForCurrency } from "../../api/Ethereum";
import { EIP1559ShouldBeUsed } from "./transaction";
import { NetworkInfo, Transaction } from "./types";
import { inferDynamicRange } from "../../range";
import { Account } from "@ledgerhq/types-live";
import { makeLRUCache } from "../../cache";
import { getEnv } from "../../env";

export const getNetworkInfo = async (
  currency: CryptoCurrency
): Promise<NetworkInfo> => {
  const api = apiForCurrency(currency);

  const { low, medium, high, next_base } = await api.getGasTrackerBarometer(
    currency
  );
  const minValue = low;
  const maxValue = high.lte(low) ? low.times(2) : high;
  const initial = medium;

  if (EIP1559ShouldBeUsed(currency)) {
    const maxPriorityFeePerGas = inferDynamicRange(initial, {
      minValue,
      maxValue,
    });
    const nextBaseFeePerGas = next_base;

    return {
      family: "ethereum",
      maxPriorityFeePerGas,
      nextBaseFeePerGas,
    };
  }

  const gasPrice = inferDynamicRange(initial, {
    minValue,
    maxValue,
  });

  return {
    family: "ethereum",
    gasPrice,
  };
};

export const inferGasPrice = (
  tx: Transaction,
  networkInfo: NetworkInfo
): BigNumber | undefined => {
  return tx.feesStrategy === "slow"
    ? networkInfo?.gasPrice?.min
    : tx.feesStrategy === "medium"
    ? networkInfo?.gasPrice?.initial
    : tx.feesStrategy === "fast"
    ? networkInfo?.gasPrice?.max
    : tx.gasPrice || networkInfo?.gasPrice?.initial;
};

export const inferMaxPriorityFeePerGas = (
  tx: Transaction,
  networkInfo: NetworkInfo
): BigNumber | undefined => {
  if (networkInfo.maxPriorityFeePerGas)
    return tx.feesStrategy === "slow"
      ? networkInfo?.maxPriorityFeePerGas?.min
      : tx.feesStrategy === "medium"
      ? networkInfo?.maxPriorityFeePerGas?.initial
      : tx.feesStrategy === "fast"
      ? networkInfo?.maxPriorityFeePerGas?.max
      : tx.maxPriorityFeePerGas || networkInfo?.maxPriorityFeePerGas?.initial;
};

export const inferMaxFeePerGas = (
  tx: Transaction,
  priorityFeePerGas: BigNumber | undefined,
  networkInfo: NetworkInfo
): BigNumber | null | undefined => {
  if (tx.maxFeePerGas) return tx.maxFeePerGas;

  const amplifiedBaseFee = networkInfo?.nextBaseFeePerGas?.multipliedBy(2);
  return amplifiedBaseFee?.plus(priorityFeePerGas || 0);
};

export const estimateGasLimit: (
  account: Account,
  transaction: {
    from: string;
    to: string;
    value: string;
    data: string;
  }
) => Promise<BigNumber> = makeLRUCache(
  (
    account: Account,
    transaction: {
      from: string;
      to: string;
      value: string;
      data: string;
    }
  ) => {
    const api = apiForCurrency(account.currency);
    return api
      .getDryRunGasLimit(transaction)
      .then((value) =>
        value.eq(21000) // regular ETH send should not be amplified
          ? value
          : value.times(getEnv("ETHEREUM_GAS_LIMIT_AMPLIFIER")).integerValue()
      )
      .catch(() => api.getFallbackGasLimit(transaction.to));
  },
  (account, { from, to, value, data }) => `${from}+${to}+${value}+${data}`
);

export default {
  getNetworkInfo,
  inferGasPrice,
  inferMaxFeePerGas,
  inferMaxPriorityFeePerGas,
};
