import { getServerInfos, getTransactions } from "../network";
import type { XrplOperation } from "../network/types";
import { XrpMemo, XrpOperation } from "../types";
import { RIPPLE_EPOCH } from "./utils";

/**
 * Returns list of "Payment" Operations associated to an account.
 * @param address Account address
 * @param blockHeight Height to start searching for operations
 * @returns
 */
export async function listOperations(
  address: string,
  blockHeight: number,
): Promise<XrpOperation[]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
  const startAt = Math.max(blockHeight, minLedgerVersion);

  const transactions = await getTransactions(address, {
    ledger_index_min: startAt,
    ledger_index_max: maxLedgerVersion,
  });

  return transactions
    .filter(op => op.tx.TransactionType === "Payment")
    .map(convertToCoreOperation(address));
}

const convertToCoreOperation =
  (address: string) =>
  (operation: XrplOperation): XrpOperation => {
    const {
      meta: { delivered_amount },
      tx: {
        TransactionType,
        Fee,
        hash,
        inLedger,
        date,
        Account,
        Destination,
        DestinationTag,
        Sequence,
        Memos,
      },
    } = operation;

    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? BigInt(delivered_amount)
        : BigInt(0);

    const fee = BigInt(Fee);
    if (type === "OUT") {
      if (!Number.isNaN(fee)) {
        value = value + fee;
      }
    }

    const toEpochDate = (RIPPLE_EPOCH + date) * 1000;

    let details = {};
    if (DestinationTag) {
      details = {
        ...details,
        destinationTag: DestinationTag,
      };
    }

    const memos: XrpMemo[] | undefined = Memos?.map(m => {
      const memo = {
        data: m?.Memo?.MemoData,
        format: m?.Memo?.MemoFormat,
        type: m?.Memo?.MemoType,
      };
      // Remove `undefined` properties
      return Object.fromEntries(Object.entries(memo).filter(([, v]) => v));
    });
    if (memos) {
      details = {
        ...details,
        memos,
      };
    }

    let op: XrpOperation = {
      hash,
      address,
      type: TransactionType,
      simpleType: type,
      value,
      fee,
      blockHeight: inLedger,
      senders: [Account],
      recipients: [Destination],
      date: new Date(toEpochDate),
      transactionSequenceNumber: Sequence,
    };

    if (Object.keys(details).length != 0) {
      op = {
        ...op,
        details,
      };
    }

    return op;
  };
