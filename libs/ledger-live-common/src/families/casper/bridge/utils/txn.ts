import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "../../../../operation";
import { CASPER_FEES } from "../../consts";
import { LTxnHistoryData } from "./types";

export const getUnit = (): Unit => getCryptoCurrencyById("filecoin").units[0];

export function mapTxToOps(accountId: string, addressHash: string) {
  return (tx: LTxnHistoryData): Operation[] => {
    const ops: Operation[] = [];
    const { timestamp, amount, toAccount, fromAccount, deployHash: hash } = tx;

    const date = new Date(timestamp);
    const value = new BigNumber(amount);
    const feeToUse = new BigNumber(CASPER_FEES);

    const isSending = addressHash === fromAccount;
    const isReceiving = addressHash === toAccount;

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
  };
}
