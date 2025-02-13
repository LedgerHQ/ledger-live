import { Operation } from "@ledgerhq/coin-framework/api/types";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import { TrongridTxInfo } from "../../types";
import { formatTrongridTxResponse } from "../format";
import { TransactionTronAPI } from "../types";

export function fromTrongridTxApiToOperation(trongridTx: TransactionTronAPI): Operation {
  const trongridTxInfo: TrongridTxInfo | null | undefined = formatTrongridTxResponse(trongridTx);
  if (!trongridTxInfo) {
    throw new Error("TrongridTxInfo parsing error");
  }
  return fromTrongridTxInfoToOperation(trongridTxInfo);
}

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
