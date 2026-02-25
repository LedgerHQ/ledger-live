import { AssetInfo, Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import type { TrongridTxInfo } from "../../types";
import { Block } from "../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  block: Block,
  userAddress: string,
): Operation {
  return {
    id: trongridTxInfo.txID,
    tx: {
      hash: trongridTxInfo.txID,
      block: {
        height: block.height,
        hash: block.hash,
        time: block.time || new Date(0),
      },
      fees: fromBigNumberToBigInt<bigint>(trongridTxInfo.fee, BigInt(0)),
      date: trongridTxInfo.date,
      failed: trongridTxInfo.hasFailed,
    },
    type: inferOperationType(trongridTxInfo, userAddress),
    value: fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0)),
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to ? [trongridTxInfo.to] : [],
    asset: inferAssetInfo(trongridTxInfo),
  };
}

function inferOperationType(trongridTxInfo: TrongridTxInfo, userAddress: string): string {
  switch (true) {
    case trongridTxInfo.from === userAddress &&
      trongridTxInfo.to &&
      trongridTxInfo.to !== userAddress:
      return "OUT";
    case trongridTxInfo.to === userAddress && trongridTxInfo.from !== userAddress:
      return "IN";
    default:
      return "UNKNOWN";
  }
}

function inferAssetInfo(trongridTxInfo: TrongridTxInfo): AssetInfo {
  switch (true) {
    case trongridTxInfo.tokenType === "trc10":
      return {
        type: "trc10",
        // if tokenType is trc10, tokenId is always defined
        assetReference: trongridTxInfo.tokenId as string,
      };
    case trongridTxInfo.tokenType === "trc20":
      return {
        type: "trc20",
        // if tokenType is trc20, contractAddress is always defined
        assetReference: trongridTxInfo.tokenAddress as string,
      };
    default:
      return { type: "native" };
  }
}
