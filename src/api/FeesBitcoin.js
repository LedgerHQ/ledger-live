// @flow
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "../types";
import { getEstimatedFees } from "./Fees";

export type FeeItem = {
  key: string,
  speed: string,
  blockCount: number,
  feePerByte: BigNumber
};

export type FeeItems = {
  items: FeeItem[],
  defaultFeePerByte: BigNumber
};

export const speeds = {
  "1": "high",
  "3": "standard",
  "6": "low"
};

export const defaultBlockCount = 3;

export const getFeeItems = async (
  currency: CryptoCurrency
): Promise<FeeItems> => {
  let items = [];
  const fees = await getEstimatedFees(currency);
  let defaultFeePerByte = BigNumber(0);
  for (const key of Object.keys(fees)) {
    const feePerByte = BigNumber(Math.ceil(fees[key] / 1000));
    const blockCount = parseInt(key, 10);
    if (blockCount === defaultBlockCount) defaultFeePerByte = feePerByte;
    if (
      !Number.isNaN(blockCount) &&
      !feePerByte.isNaN() &&
      blockCount in speeds
    ) {
      items.push({
        key,
        speed: speeds[blockCount],
        blockCount,
        feePerByte
      });
    }
  }
  items = items.sort((a, b) => a.blockCount - b.blockCount);
  return { items, defaultFeePerByte };
};
