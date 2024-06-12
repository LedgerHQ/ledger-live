import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Operation } from "@ledgerhq/types-live";
import { XrplOperation } from "../network/types";
import { RIPPLE_EPOCH } from "../logic";

const XrplOperationToLiveOperation =
  (accountId: string, address: string) =>
  ({
    meta: { delivered_amount },
    tx: { Fee, hash, inLedger, date, Account, Destination, Sequence },
  }: XrplOperation) => {
    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? new BigNumber(delivered_amount)
        : new BigNumber(0);
    const feeValue = new BigNumber(Fee);

    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value.plus(feeValue);
      }
    }

    const toEpochDate = (RIPPLE_EPOCH + date) * 1000;

    const op: Operation = {
      id: encodeOperationId(accountId, hash, type),
      hash: hash,
      accountId,
      type,
      value,
      fee: feeValue,
      blockHash: null,
      blockHeight: inLedger,
      senders: [Account],
      recipients: [Destination],
      date: new Date(toEpochDate),
      transactionSequenceNumber: Sequence,
      extra: {},
    };

    return op;
  };

export const filterOperations = (
  transactions: XrplOperation[],
  accountId: string,
  address: string,
) => {
  return transactions
    .filter(
      ({ tx, meta }: XrplOperation) =>
        tx.TransactionType === "Payment" && typeof meta.delivered_amount === "string",
    )
    .map(XrplOperationToLiveOperation(accountId, address))
    .filter((op): op is Operation => Boolean(op));
};
