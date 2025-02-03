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
  // await loadSui();

  // const { registry } = await suiAPI.getRegistry();
  const registry = await suiAPI.getRegistry();
  if (extractExtrinsicArg) {
    //
  }

  if (forceLatestParams) {
    //
  }

  const unsigned: TransactionPayloadInfo = {
    address,
    blockHash: "",
    era: "0x",
    genesisHash: "",
    method: "0x",
    nonce: nonceToUse,
    transactionVersion: "0x",
    specVersion: "0x",
    version: EXTRINSIC_VERSION,
    metadataHash: new Uint8Array(256),
    // metadataHash: hexToU8a("01" + metadataHash),
    mode: 1,
  };

  return {
    registry,
    unsigned,
  };
}
