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
  _nonceToUse: number,
  extractExtrinsicArg: CreateExtrinsicArg,
  _forceLatestParams: boolean = false,
): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(address, extractExtrinsicArg);

  return {
    executeTransactionBlock: suiAPI.executeTransactionBlock,
    unsigned,
  };
}
