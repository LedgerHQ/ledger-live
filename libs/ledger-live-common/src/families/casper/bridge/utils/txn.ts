import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import { GetAccountShapeArg0 } from "../../../../bridge/jsHelpers";
import { parseCurrencyUnit } from "../../../../currencies";
import { encodeOperationId } from "../../../../operation";
import { CASPER_FEES } from "../../consts";
import { LTxnHistoryData } from "./types";

export const getUnit = (): Unit => getCryptoCurrencyById("filecoin").units[0];

export function mapTxToOps(
  accountId: string,
  { address }: GetAccountShapeArg0
) {
  return (tx: LTxnHistoryData): Operation[] => {
    const ops: Operation[] = [];
    const { timestamp, amount, toAccount, fromAccount, deployHash: hash } = tx;

    const date = new Date(timestamp);
    const value = parseCurrencyUnit(getUnit(), amount.toString());
    const feeToUse = parseCurrencyUnit(getUnit(), CASPER_FEES.toString());

    const isSending = address === fromAccount;
    const isReceiving = address === toAccount;

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight: undefined,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {},
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight: undefined,
        blockHash: null,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {},
      });
    }

    return ops;
    return ops;
  };
}
