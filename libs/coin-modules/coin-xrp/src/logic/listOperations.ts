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
  {
    limit,
    mostRecentIndex,
    startAt,
  }: {
    limit?: number;
    mostRecentIndex?: number | undefined;
    startAt?: number;
  },
): Promise<[XrpOperation[], number]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  let options: {
    ledger_index_min?: number;
    ledger_index_max?: number;
    limit?: number;
    tx_type?: string;
  } = {
    ledger_index_max: mostRecentIndex ?? maxLedgerVersion,
    tx_type: "Payment",
  };

  if (limit) {
    options = {
      ...options,
      limit,
    };
  }
  if (startAt) {
    options = {
      ...options,
      // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
      ledger_index_min: Math.max(startAt, minLedgerVersion),
    };
  }

  // We need to filter out the transactions that are not "Payment" type because the filter on "tx_type" of the node RPC
  // is not working as expected. It returns all the transactions. We need to call the node RPC multiple times to get the
  // desired number of transactions by the limiter.
  let transactions: XrplOperation[] = [];
  let needToStop = true;
  do {
    const newTransactions = await getTransactions(address, options);
    const newPaymentsTxs = newTransactions.filter(tx => tx.tx_json.TransactionType === "Payment");

    needToStop = options.limit ? newTransactions.length < options.limit : true;

    transactions = transactions.concat(newPaymentsTxs);
  } while (
    options.limit &&
    !needToStop &&
    transactions.length < options.limit &&
    (options.limit -= transactions.length) &&
    (options.ledger_index_max = transactions.slice(-1)[0].tx_json.ledger_index - 1)
  );

  return [
    transactions.map(convertToCoreOperation(address)),
    transactions.slice(-1)[0].tx_json.ledger_index - 1, // Returns the next index to start from for pagination
  ];
}

const convertToCoreOperation =
  (address: string) =>
  (operation: XrplOperation): XrpOperation => {
    const {
      ledger_hash,
      hash,
      close_time_iso,
      meta: { delivered_amount },
      tx_json: {
        TransactionType,
        Fee,
        date,
        Account,
        Destination,
        DestinationTag,
        Sequence,
        Memos,
        ledger_index,
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
      blockTime: new Date(close_time_iso),
      blockHash: ledger_hash,
      hash,
      address,
      type: TransactionType,
      simpleType: type,
      value,
      fee,
      blockHeight: ledger_index,
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
