import type { TonContext } from "../config";
import { fetchAccount, fetchJettonTransfersUntilLt, fetchTransactionsUntilLt } from "../network";
import { jettonTransferOf, yieldsOperation, yieldsSubAccount } from "./accountActivity";

/** Starts a request unless aborted, rejecting with the reason as soon as the signal aborts (live-network takes no signal). */
function abortable<T>(signal: AbortSignal | undefined, request: () => Promise<T>): Promise<T> {
  if (!signal) return request();
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    request()
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

/** Pages newest first as the TON sync does (each page repeats the previous page's last row, dropped once its hash matches), stopping at the first page where `found` holds. */
async function someHistoryPage<Row>(
  fetchPage: (endLt?: string) => Promise<Row[]>,
  ltOf: (row: Row) => string,
  hashOf: (row: Row) => string,
  found: (rows: Row[]) => Promise<boolean> | boolean,
): Promise<boolean> {
  const searchFrom = async (rows: Row[]): Promise<boolean> => {
    const lastRow = rows.at(-1);
    if (lastRow === undefined) return false;
    if (await found(rows)) return true;
    const page = await fetchPage(ltOf(lastRow));
    const [first, ...rest] = page;
    return searchFrom(first !== undefined && hashOf(first) === hashOf(lastRow) ? rest : page);
  };
  return searchFrom(await fetchPage());
}

/** Whether an address was ever used, as the TON sync decides `used`: a balance, a transaction it maps to an operation, or a transfer of a known jetton not blacklisted (a sub-account). */
export async function isUsed(
  context: TonContext,
  address: string,
  blacklistedTokenIds: readonly string[] = [],
): Promise<boolean> {
  const signal = context.signal instanceof AbortSignal ? context.signal : undefined;
  signal?.throwIfAborted();
  const config = await context.config();
  const account = await abortable(signal, () => fetchAccount(config, address));
  if (BigInt(account.balance) > 0n) return true;
  // Without a last transaction the sync reads no history, jettons included.
  if (!account.last_transaction_lt) return false;

  const yieldsAnOperation = await someHistoryPage(
    async endLt =>
      (await abortable(signal, () => fetchTransactionsUntilLt(config, address, endLt)))
        .transactions,
    tx => tx.lt,
    tx => tx.hash,
    txs => txs.some(tx => yieldsOperation(address, tx)),
  );
  if (yieldsAnOperation) return true;

  return someHistoryPage(
    endLt => abortable(signal, () => fetchJettonTransfersUntilLt(config, address, endLt)),
    transfer => transfer.transaction_lt,
    transfer => transfer.transaction_hash,
    async transfers => {
      for (const transfer of transfers) {
        const jettonTransfer = await jettonTransferOf(address, transfer, "ton");
        if (yieldsSubAccount(jettonTransfer?.token, blacklistedTokenIds)) return true;
      }
      return false;
    },
  );
}
