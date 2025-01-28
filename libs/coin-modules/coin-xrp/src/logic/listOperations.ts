import { getServerInfos, getTransactions } from "../network";
import type { Marker, XrplOperation } from "../network/types";
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
    minHeight,
    token,
  }: {
    // pagination:
    limit?: number;
    token?: string;
    // filters:
    minHeight?: number; // used to retrieve operations from a specific block height until top most
  },
): Promise<[XrpOperation[], string]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);

  type Options = {
    ledger_index_min?: number;
    limit?: number;
    tx_type?: string;
    token?: Marker;
  };

  let options: Options = {
    tx_type: "Payment",
  };

  if (limit) {
    options = {
      ...options,
      limit,
    };
  }

  if (token) {
    options = {
      ...options,
      token: JSON.parse(token),
    };
  }

  if (minHeight !== undefined) {
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
    const response = await getTransactions(address, options);
    const txs = response.transactions;
    const token = response.marker;
    // Filter out the transactions that are not "Payment" type because the filter on "tx_type" of the node RPC is not working as expected.
    const paymentTxs = txs.filter(tx => tx.tx_json.TransactionType === "Payment");
    const shortage = (options.limit && txs.length < options.limit) || false;
    const nextOptions = { ...options };
    if (token) {
      nextOptions.token = token;
      if (nextOptions.limit) nextOptions.limit -= paymentTxs.length;
    }
    return [shortage, nextOptions, paymentTxs];
  }

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

  // the next index to start the pagination from
  const next = nextOptions.token ? JSON.stringify(nextOptions.token) : "";
  return [transactions.map(convertToCoreOperation(address)), next];
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
