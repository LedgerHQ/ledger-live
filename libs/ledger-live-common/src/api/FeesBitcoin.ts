import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BigNumber } from "bignumber.js";
import type { FeeItems } from "../families/bitcoin/types";
import { getEstimatedFees } from "./Fees";

export const speeds = {
  "1": "fast",
  "3": "medium",
  "6": "slow",
};

export const defaultBlockCount = 3;

export const getFeeItems = async (
  currency: CryptoCurrency
): Promise<FeeItems> => {
  const all: Array<{
    key: string;
    speed: string;
    blockCount: number;
    feePerByte: BigNumber;
  }> = [];
  const fees = await getEstimatedFees(currency);
  let defaultFeePerByte = new BigNumber(0);

  for (const key of Object.keys(fees)) {
    const feePerByte = new BigNumber(Math.ceil(fees[key] / 1000));
    const blockCount = parseInt(key, 10);
    if (blockCount === defaultBlockCount) defaultFeePerByte = feePerByte;

    if (
      !Number.isNaN(blockCount) &&
      !feePerByte.isNaN() &&
      blockCount in speeds
    ) {
      all.push({
        key,
        speed: speeds[blockCount],
        blockCount,
        feePerByte,
      });
    }
  }

  const items = all
    .sort((a, b) => a.blockCount - b.blockCount)
    .map(({ key, speed, feePerByte }) => ({
      key,
      speed,
      feePerByte,
    }));
  return {
    items,
    defaultFeePerByte,
  };
};
