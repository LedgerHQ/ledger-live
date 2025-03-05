import { Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import { TrongridTxInfo } from "../../types";

export function fromTrongridTxInfoToOperation(trongridTxInfo: TrongridTxInfo): Operation {
  return {
    hash: trongridTxInfo.txID,
    address: trongridTxInfo.from,
    type: trongridTxInfo.type,
    value: fromBigNumberToBigInt<bigint>(trongridTxInfo.value, BigInt(0)),
    fee: fromBigNumberToBigInt<bigint>(trongridTxInfo.fee, BigInt(0)),
    block: { height: trongridTxInfo.blockHeight || 0 },
    senders: [trongridTxInfo.from],
    recipients: trongridTxInfo.to != null ? [trongridTxInfo.to] : [],
    date: trongridTxInfo.date,
    details: {
      tokenId: trongridTxInfo.tokenId,
    },
  };
}
