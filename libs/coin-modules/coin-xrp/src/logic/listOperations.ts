import { Operation } from "@ledgerhq/coin-framework/api/types";
import { getServerInfos, getTransactions, GetTransactionsOptions } from "../network";
import type { XrplOperation } from "../network/types";
import { ListOperationsOptions, XrpMemo } from "../types";
import { RIPPLE_EPOCH } from "./utils";

/**
 * Returns list of "Payment" Operations associated to an account.
 * @param address Account address
 * @param minHeight retrieve operations from a specific block height until top most (inclusive)
 *  if not provided, it will start from the oldest possible history.
 * The result is not guaranteed to contain all operations until top height (it depends of the underlying explorer),
 * so you might need to call this function multiple times to get all operations.
 * @param order whether to return operations from the top block or from the oldest block
 *   it defaults to "desc" (newest first)
 *   it doesn't control the order of the operations in the result list.
 *   this parameter is added as a workaround for the issue LIVE-16705
 * @returns a list of operations is descending order and a token to be used for pagination
 */
export async function listOperations(
  address: string,
  { limit, minHeight, token, order }: ListOperationsOptions,
): Promise<[Operation[], string]> {
  const serverInfo = await getServerInfos();
  const ledgers = serverInfo.info.complete_ledgers.split("-");
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  // by default the explorer queries the transactions in descending order (newest first)
  let forward = false;
  if (order && order === "asc") {
    forward = true;
  }

  let options: GetTransactionsOptions = {
    forward: forward,
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
      marker: JSON.parse(token),
    };
  }

  if (minHeight !== undefined && minHeight <= maxLedgerVersion) {
    // Only set ledger_index_min if minHeight is valid (not higher than current ledger)
    // LIVE-22334 fix: minHeight <= maxLedgerVersion
    options = {
      ...options,
      // if there is no ops, it might be after a clear and we prefer to pull from the oldest possible history
      ledger_index_min: Math.max(minHeight, minLedgerVersion),
    };
  }

  async function getPaymentTransactions(
    address: string,
    options: GetTransactionsOptions,
  ): Promise<[boolean, GetTransactionsOptions, XrplOperation[]]> {
    const response = await getTransactions(address, options);
    const txs = response.transactions;
    const responseMarker = response.marker;
    // Filter out the transactions that are not "Payment" type because the filter on "tx_type" of the node RPC is not working as expected.
    const paymentTxs = txs.filter(tx => tx.tx_json.TransactionType === "Payment");
    const shortage = (options.limit && txs.length < options.limit) || false;
    const { marker, ...nextOptions } = options;

    if (responseMarker) {
      (nextOptions as GetTransactionsOptions).marker = responseMarker;
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

  // the order is reversed so that the results are always sorted by newest tx first element of the list
  if (order === "asc") transactions.reverse();

  // the next index to start the pagination from
  const next = nextOptions.marker ? JSON.stringify(nextOptions.marker) : "";
  return [transactions.map(convertToCoreOperation(address)), next];
}

const convertToCoreOperation =
  (address: string) =>
  (operation: XrplOperation): Operation => {
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
        Memos,
        ledger_index,
        Sequence,
        SigningPubKey,
      },
    } = operation;

    const type = Account === address ? "OUT" : "IN";
    const value =
      delivered_amount && typeof delivered_amount === "string"
        ? BigInt(delivered_amount)
        : BigInt(0);

    const fees = BigInt(Fee);

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

    details = {
      ...details,
      xrpTxType: TransactionType,
      sequence: Sequence,
      signingPubKey: SigningPubKey,
    };

    // Note: it's technically possible on XRP to have failures where fees have not been paid, which contradicts the
    // "failed" field specification. However, since we are only converting transactions included in published blocks
    // here, this edge case should not be possible.
    // See https://xrpl.org/docs/references/protocol/transactions/transaction-results
    const failed = operation.meta.TransactionResult !== "tesSUCCESS";

    let op: Operation = {
      id: hash,
      asset: { type: "native" },
      tx: {
        hash: hash,
        fees: fees,
        // On XRP, the fee payer is always the Account that initiated the transaction.
        feesPayer: Account,
        date: new Date(toEpochDate),
        block: {
          time: new Date(close_time_iso),
          hash: ledger_hash,
          height: ledger_index,
        },
        failed: failed,
      },
      type: type,
      value,
      senders: [Account],
      recipients: Destination ? [Destination] : [],
    };

    if (Object.keys(details).length !== 0) {
      op = {
        ...op,
        details,
      };
    }

    return op;
  };
