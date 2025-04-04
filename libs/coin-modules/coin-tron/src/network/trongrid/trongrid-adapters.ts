import { Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import type { TrongridTxInfo, TronToken } from "../../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  userAddress: string,
): Operation<TronToken> {
  const operationType = inferOperationType(trongridTxInfo, userAddress);
  return {
    operationIndex: 0,
    tx: {
      hash: trongridTxInfo.txID,
      block: { height: trongridTxInfo.blockHeight || 0, time: trongridTxInfo.date },
      fees: fromBigNumberToBigInt<bigint>(trongridTxInfo.fee, BigInt(0)),
      date: trongridTxInfo.date,
    },
    type: operationType,
    value: fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0)),
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to != null ? [trongridTxInfo.to] : [],
    asset: inferAssetInfo(trongridTxInfo, operationType),
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

function inferAssetInfo(
  trongridTxInfo: TrongridTxInfo,
  operationType: string,
): TronToken | undefined {
  switch (true) {
    case trongridTxInfo.tokenType === "trc10":
      return {
        standard: "trc10",
        // if tokenType is trc10, tokenId is always defined
        tokenId: trongridTxInfo.tokenId as string,
      };
    case trongridTxInfo.tokenType === "trc20":
      return {
        standard: "trc20",
        // if tokenType is trc20, contractAddress is always defined
        contractAddress: trongridTxInfo.tokenAddress as string,
      };
    case operationType === "OUT" ||
      (operationType === "IN" && trongridTxInfo.tokenType === undefined):
      return {
        standard: "native",
      };
    default:
      // asset is undefined when dealing with native currency
      return undefined;
  }
}
