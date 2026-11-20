import type { TonContext } from "../config";
import {
  SYNC_PAGE_SIZE,
  fetchAccount,
  fetchJettonTransfersUntilLt,
  fetchTransactionsUntilLt,
} from "../network";
import { jettonTransferOf, yieldsOperation, yieldsSubAccount } from "./accountActivity";

// live-network takes no signal.
function abortable<T>(signal: AbortSignal | undefined, request: () => Promise<T>): Promise<T> {
  if (!signal) return request();
  signal.throwIfAborted();
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve()
      .then(request)
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

// A page starts at the previous page's last lt, so it repeats the rows sharing that lt.
async function someHistoryPage<Row>(
  fetchPage: (endLt?: string) => Promise<Row[]>,
  ltOf: (row: Row) => string,
  hashOf: (row: Row) => string,
  found: (rows: Row[]) => Promise<boolean> | boolean,
): Promise<boolean> {
  const seenHashes = new Set<string>();
  let endLt: string | undefined;
  for (;;) {
    const page = await fetchPage(endLt);
    const rows = page.filter(row => !seenHashes.has(hashOf(row)));
    const lastRow = rows.at(-1);
    if (lastRow === undefined) {
      // As the legacy sync, which fails on the hash mismatch: rows past the page are unreachable.
      if (page.length >= SYNC_PAGE_SIZE)
        throw new Error("[ton] more history rows share an lt than a page holds");
      return false;
    }
    for (const row of rows) seenHashes.add(hashOf(row));
    if (await found(rows)) return true;
    endLt = ltOf(lastRow);
  }
}

// Mirrors how the TON sync decides `used`.
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

  // "0" is a wallet without transactions, which can still have received jettons.
  const yieldsAnOperation =
    account.last_transaction_lt !== "0" &&
    (await someHistoryPage(
      async endLt =>
        (await abortable(signal, () => fetchTransactionsUntilLt(config, address, endLt)))
          .transactions,
      tx => tx.lt,
      tx => tx.hash,
      txs => txs.some(tx => yieldsOperation(address, tx)),
    ));
  if (yieldsAnOperation) return true;

  return someHistoryPage(
    endLt => abortable(signal, () => fetchJettonTransfersUntilLt(config, address, endLt)),
    transfer => transfer.transaction_lt,
    transfer => transfer.transaction_hash,
    async transfers => {
      for (const transfer of transfers) {
        const jettonTransfer = await abortable(signal, () =>
          jettonTransferOf(address, transfer, "ton"),
        );
        if (yieldsSubAccount(jettonTransfer?.token, blacklistedTokenIds)) return true;
      }
      return false;
    },
  );
}
