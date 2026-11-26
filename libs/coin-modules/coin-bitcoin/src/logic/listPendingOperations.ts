import type { PendingOperation } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchPendingTxs } from "../network/explorer";
import { explorerAddress } from "./cashaddr";
import { fetchStillPending } from "./getPendingTransaction";
import { lookUpPendingTxs } from "./getSpendableUtxos";
import { toPendingOperation } from "./listOperations";

/**
 * The operations of the address's unconfirmed transactions, as the explorer's pending service sees
 * them (ADR-017): those it sends and those it receives. Not paginated. Fees are exact.
 *
 * Each listed transaction is checked against the explorer's view of it (one `tx` and one `tx/hex`
 * request each): one mined, replaced or dropped since is left out.
 *
 * A snapshot: callers merge it with `listOperations` by hash, the confirmed operation winning, and
 * keep their own optimistic operations (a transaction sent through a private relay is not seen).
 */
export async function listPendingOperations(
  context: BitcoinContext,
  currencyId: string,
  address: string,
): Promise<PendingOperation[]> {
  const config = await context.config(currencyId);
  // The explorer answers in the form it was queried with: the same form is compared below.
  const queried = explorerAddress(config, address);
  const txs = await fetchPendingTxs(config, queried);
  const requestedAt = new Date();
  const candidates: PendingOperation[] = [];
  for (const tx of txs) {
    // A mined transaction is not pending, whatever list the explorer put it in.
    if (tx.block) continue;
    const operation = toPendingOperation(tx, queried, requestedAt);
    if (operation) candidates.push(operation);
  }
  // The address's pending list goes stale: it keeps mined and replaced transactions for minutes.
  // A replaced transaction is never confirmed, so a caller merging by hash would show it forever:
  // each one is checked against the explorer's view of the transaction itself, a few at a time.
  const stillPending = await lookUpPendingTxs(
    candidates.map(operation => operation.tx.hash),
    hash => fetchStillPending(config, hash),
  );
  return candidates.filter((_, index) => stillPending[index] !== undefined);
}
