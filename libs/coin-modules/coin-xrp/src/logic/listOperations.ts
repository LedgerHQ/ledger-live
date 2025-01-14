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
    maxHeight,
    minHeight,
  }: {
    limit?: number;
    maxHeight?: number | undefined; // used for pagination
    minHeight?: number; // used to retrieve operations from a specific block height until top most
  },
): Promise<[XrpOperation[], number]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  type Options = {
    ledger_index_min?: number;
    ledger_index_max?: number;
    limit?: number;
    tx_type?: string;
  };

  let options: Options = {
    ledger_index_max: maxHeight ?? maxLedgerVersion,
    tx_type: "Payment",
  };

  if (limit) {
    options = {
      ...options,
      limit,
    };
  }
  if (minHeight) {
    options = {
      ...options,
      // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
      ledger_index_min: Math.max(minHeight, minLedgerVersion),
    };
  }

  async function getPaymentTransactions(
    address: string,
    options: Options,
  ): Promise<[boolean, Options, XrplOperation[]]> {
    const txs = await getTransactions(address, options);
    // Filter out the transactions that are not "Payment" type because the filter on "tx_type" of the node RPC is not working as expected.
    const paymentTxs = txs.filter(tx => tx.tx_json.TransactionType === "Payment");
    const shortage = (options.limit && txs.length < options.limit) || false;
    const lastTransaction = txs.slice(-1)[0];
    const nextOptions = { ...options };
    if (lastTransaction) {
      nextOptions.ledger_index_max = lastTransaction.tx_json.ledger_index - 1;
      if (nextOptions.limit) nextOptions.limit -= paymentTxs.length;
    }
    return [shortage, nextOptions, paymentTxs];
  }

  // TODO BUG: given the number of txs belonging to the SAME block > limit
  //           when user loop over pages using the provided token
  //           then user misses some txs that doesn't fit the page size limit
  //           because the "next token" is a block height (solution is to use an opaque token instead)
  let [txShortage, nextOptions, transactions] = await getPaymentTransactions(address, options);
  const isEnough = () => txShortage || (limit && transactions.length >= limit);
  // We need to call the node RPC multiple times to get the desired number of transactions by the limiter.
  while (nextOptions.limit && !isEnough()) {
    const [newTxShortage, newNextOptions, newTransactions] = await getPaymentTransactions(
      address,
      nextOptions,
    );
    txShortage = newTxShortage;
    nextOptions = newNextOptions;
    transactions = transactions.concat(newTransactions);
  }

  const lastTransaction = transactions.slice(-1)[0];
  // the next index to start the pagination from
  const nextIndex = lastTransaction
    ? Math.max(lastTransaction.tx_json.ledger_index - 1, minLedgerVersion)
    : minLedgerVersion;

  return [transactions.map(convertToCoreOperation(address)), nextIndex];
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
