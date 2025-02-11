import BigNumber from "bignumber.js";
import type { CoreTransaction } from "../types";
import suiAPI from "../network";
import { TransactionPayloadInfo } from "../types";

const EXTRINSIC_VERSION = 4;

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
  // await loadSui();

  // const { registry } = await suiAPI.getRegistry();
  // const registry = await suiAPI.getRegistry()
  if (extractExtrinsicArg) {
    //
  }

  // if (forceLatestParams) {
  //   //
  // }

  const unsigned = await suiAPI.createTransaction(address);

  return {
    // registry,
    unsigned,
  };
}
