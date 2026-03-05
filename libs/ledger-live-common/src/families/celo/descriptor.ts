import type { CoinDescriptor, CustomFeeInputDescriptor } from "../../bridge/descriptor";
import { BigNumber } from "bignumber.js";

const GWEI_DIVISOR = new BigNumber(10).pow(9);

function isBigNumber(value: unknown): value is BigNumber {
  return BigNumber.isBigNumber(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function weiToGwei(wei: BigNumber): string {
  return wei.dividedBy(GWEI_DIVISOR).decimalPlaces(6, BigNumber.ROUND_DOWN).toFixed();
}

function gweiToWei(gwei: string): BigNumber {
  const val = new BigNumber(gwei);
  if (val.isNaN() || val.isNegative()) return new BigNumber(0);
  return val.times(GWEI_DIVISOR).integerValue(BigNumber.ROUND_DOWN);
}

function getSuggestedFeesRange(
  transaction: Record<string, unknown>,
): { min: string; max: string } | null {
  // Celo is EVM-compatible so we try to use gasPrice from networkInfo first, then directly on transaction
  const networkInfo = transaction.networkInfo;
  const rawGasPrice = isRecord(networkInfo) ? networkInfo.gasPrice : transaction.gasPrice;

  if (isBigNumber(rawGasPrice) && rawGasPrice.gt(0)) {
    return {
      min: weiToGwei(rawGasPrice.times(0.8).integerValue(BigNumber.ROUND_DOWN)),
      max: weiToGwei(rawGasPrice.times(1.2).integerValue(BigNumber.ROUND_UP)),
    };
  }

  // Fallback: derive range from current transaction fees
  const fees = transaction.fees;
  if (isBigNumber(fees) && fees.gt(0)) {
    return {
      min: weiToGwei(fees.times(0.8).integerValue(BigNumber.ROUND_DOWN)),
      max: weiToGwei(fees.times(1.2).integerValue(BigNumber.ROUND_UP)),
    };
  }

  return null;
}

const celoCustomInputs: readonly CustomFeeInputDescriptor[] = [
  {
    key: "fees",
    type: "number",
    unitLabel: "Gwei",
    suggestedRange: {
      getRange: transaction => {
        if (!isRecord(transaction)) return null;
        return getSuggestedFeesRange(transaction);
      },
    },
  },
];

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {},
    fees: {
      hasPresets: false,
      hasCustom: true,
      hasCustomAssets: true,
      custom: {
        inputs: celoCustomInputs,
        getInitialValues: (transaction): Record<string, string> => {
          if (!isRecord(transaction)) return { fees: "" };

          const fees = transaction.fees;
          if (!isBigNumber(fees) || fees.lte(0)) return { fees: "" };

          return { fees: weiToGwei(fees) };
        },
        buildTransactionPatch: values => {
          const patch: Record<string, unknown> = { feesStrategy: "custom" };

          const feesWei = gweiToWei(values.fees ?? "0");
          if (!feesWei.isNaN() && feesWei.gt(0)) {
            patch.fees = feesWei;
          }

          return patch;
        },
      },
      customAssets: {
        options: [
          { id: "eth", ticker: "ETH", label: "Ethereum", unitLabel: "Gwei" },
          { id: "btc", ticker: "BTC", label: "Bitcoin", unitLabel: "sat" },
          { id: "usdc", ticker: "USDC", label: "USD Coin", unitLabel: "USDC" },
          { id: "usdt", ticker: "USDT", label: "Tether", unitLabel: "USDT" },
          { id: "celo", ticker: "Celo", label: "Celo", unitLabel: "Gwei" },
        ],
        defaultId: "eth",
      },
    },
  },
};
