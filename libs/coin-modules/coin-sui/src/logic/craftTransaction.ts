import BigNumber from "bignumber.js";
import type { CoreTransaction } from "../types";
import suiAPI from "../network";

export type CreateExtrinsicArg = {
  mode: any;
  amount: BigNumber;
  recipient: string;
  isFirstBond: boolean;
  validators?: string[] | undefined;
  useAllAmount?: boolean | undefined;
  rewardDestination?: string | null | undefined;
  numSlashingSpans?: number | undefined;
  era?: string | null | undefined;
};

export async function craftTransaction(
  address: string,
  nonceToUse: number,
  extractExtrinsicArg: CreateExtrinsicArg,
  forceLatestParams: boolean = false,
): Promise<CoreTransaction> {
  console.log("craftTransaction", address, nonceToUse, extractExtrinsicArg, forceLatestParams);

  const unsigned = await suiAPI.createTransaction(address, extractExtrinsicArg);

  console.log("craftTransaction unsigned", unsigned);

  return {
    executeTransactionBlock: suiAPI.executeTransactionBlock,
    unsigned,
  };
}
