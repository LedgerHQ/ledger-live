import { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-module-framework/utils";
import type { TrongridTxInfo } from "../../types";
import { Block } from "../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  block: Block,
  userAddress: string,
): Operation {
  const opType = inferOperationType(trongridTxInfo, userAddress);
  const senders = [trongridTxInfo.from];
  const recipients = trongridTxInfo.to ? [trongridTxInfo.to] : [];
  const value = fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0));
  const isToken =
    trongridTxInfo.tokenType === "trc10" || trongridTxInfo.tokenType === "trc20";

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
      feesPayer: trongridTxInfo.feesPayer ?? trongridTxInfo.from,
      date: trongridTxInfo.date,
      failed: trongridTxInfo.hasFailed,
    },
    type: opType,
    value,
    senders,
    recipients,
    asset: inferAssetInfo(trongridTxInfo, userAddress),
    ...(isToken
      ? {
          details: {
            ledgerOpType: opType,
            assetAmount: value.toString(),
            assetSenders: senders,
            assetRecipients: recipients,
          },
        }
      : {}),
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

export function inferAssetInfo(trongridTxInfo: TrongridTxInfo, userAddress: string): AssetInfo {
  switch (true) {
    case trongridTxInfo.tokenType === "trc10":
      return {
        type: "trc10",
        // if tokenType is trc10, tokenId is always defined
        assetReference: trongridTxInfo.tokenId as string,
        assetOwner: userAddress,
      };
    case trongridTxInfo.tokenType === "trc20":
      return {
        type: "trc20",
        // if tokenType is trc20, contractAddress is always defined
        assetReference: trongridTxInfo.tokenAddress as string,
        assetOwner: userAddress,
      };
    default:
      return { type: "native" };
  }
}
