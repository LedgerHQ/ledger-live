import { AssetInfo, Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import type { TrongridTxInfo } from "../../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  userAddress: string,
): Operation {
  return {
    id: trongridTxInfo.txID,
    tx: {
      hash: trongridTxInfo.txID,
      block: { height: trongridTxInfo.blockHeight || 0, time: trongridTxInfo.date },
      fees: fromBigNumberToBigInt<bigint>(trongridTxInfo.fee, BigInt(0)),
      date: trongridTxInfo.date,
    },
    type: inferOperationType(trongridTxInfo, userAddress),
    value: fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0)),
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to != null ? [trongridTxInfo.to] : [],
    asset: inferAssetInfo(trongridTxInfo),
  };
}

function inferOperationType(trongridTxInfo: TrongridTxInfo, userAddress: string): string {
  switch (true) {
    case trongridTxInfo.from === userAddress &&
      trongridTxInfo.to != null &&
      trongridTxInfo.to != userAddress:
      return "OUT";
    case trongridTxInfo.to === userAddress && trongridTxInfo.from != userAddress:
      return "IN";
    default:
      return "UNKNOWN";
  }
}

function inferAssetInfo(trongridTxInfo: TrongridTxInfo): AssetInfo {
  switch (true) {
    case trongridTxInfo.tokenType === "trc10":
      return {
        type: "token",
        standard: "trc10",
        // if tokenType is trc10, tokenId is always defined
        assetReference: trongridTxInfo.tokenId as string,
      };
    case trongridTxInfo.tokenType === "trc20":
      return {
        type: "token",
        standard: "trc20",
        // if tokenType is trc20, contractAddress is always defined
        assetReference: trongridTxInfo.tokenAddress as string,
      };
    default:
      return { type: "native" };
  }
}
