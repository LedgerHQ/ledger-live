import { Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import { TrongridTxInfo } from "../../types";

export function fromTrongridTxInfoToOperation(
  trongridTxInfo: TrongridTxInfo,
  userAddress: string,
): Operation {
  return {
    tx: {
      hash: trongridTxInfo.txID,
      block: { height: trongridTxInfo.blockHeight || 0, time: trongridTxInfo.date },
      fees: fromBigNumberToBigInt<bigint>(trongridTxInfo.fee, BigInt(0)),
    },
    operationIndex: 0,
    type: getOperationType(trongridTxInfo, userAddress),
    value: fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0)),
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to != null ? [trongridTxInfo.to] : [],
    asset:
      trongridTxInfo.tokenType != null
        ? {
            standard: trongridTxInfo.tokenType,
            tokenAddressOrId: trongridTxInfo.tokenAddressOrId as string,
          }
        : undefined,
  };
}

function getOperationType(trongridTxInfo: TrongridTxInfo, userAddress: string): string {
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
