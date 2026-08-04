/**
 * Recovers what a Zcash transaction did, where an explorer can only guess.
 *
 * An explorer sees a transaction's transparent bundle and nothing else, which
 * leaves it wrong about two things whenever value crosses a shielded boundary:
 *
 * - **The fee.** Derived as `Σ transparent inputs − Σ transparent outputs`, it
 *   swallows any value that entered a shielded pool. A transparent-to-shielded
 *   send of 0.1 ZEC paying 0.00055 in fees looks like it paid 0.10055.
 * - **The destination.** The payee lives in an encrypted output, so the only
 *   address left to report is the transparent change — which pays the sender
 *   back rather than the payee.
 *
 * Both are recovered from the raw transaction in one fetch: the fee from the
 * value balance of every pool, the payee by trial-decrypting our own outputs
 * with the account's viewing key.
 *
 * Fees are applied to the transaction, before operations are derived from it,
 * so a transaction's sender and recipient agree on what it cost. Payees are
 * returned separately because they have no place on a transaction — they only
 * make sense on the operation that spent from this account.
 */

import { log } from "@ledgerhq/logs";
import type { TX } from "@ledgerhq/wallet-btc/index";
import { ZCASH_LOG_TYPE } from "../constants";
import type { TransactionDetailsRequest, TransactionDetailsResult } from "../network/types";

export type ResolvedTransactions = {
  /** The transactions, with the fees that could be recovered applied. */
  transactions: TX[];
  /** Shielded addresses paid by each transaction, keyed by txid. */
  payeesByTxId: Map<string, string[]>;
};

export type DetailsResolver = (
  requests: TransactionDetailsRequest[],
) => Promise<TransactionDetailsResult[]>;

/**
 * What has been established so far. A mined transaction is immutable, so its
 * details only ever have to be established once — without this, every sync pass
 * would re-fetch the account's entire history.
 *
 * The two answers are cached apart because they do not have the same scope. A
 * fee is a property of the transaction, the same for whoever asks. Payees are
 * recovered with a viewing key and only exist relative to it: the same
 * transaction yields the payees it was sent to for the account that sent it,
 * and nothing at all for anyone else. Caching them together under the txid
 * alone would let the first account to resolve a transaction answer for the
 * others, and would freeze the empty answer given before an account's viewing
 * key is known — the state every account is in on its first sync — into a
 * permanent one.
 *
 * Transactions we failed to resolve are deliberately absent rather than stored
 * as a negative result: the failure may have been a transient fetch error, and
 * the next pass should try again. A resolved transaction with no payee, on the
 * other hand, is a complete answer worth keeping — that is what a transparent
 * transaction looks like.
 */
const feeByTxId = new Map<string, string | null>();
const payeesByKey = new Map<string, string[]>();

const payeeKey = (txid: string, ufvk: string) => `${ufvk}|${txid}`;

/** Test seam — production code has no reason to forget an immutable answer. */
export function clearTransactionDetailsCache(): void {
  feeByTxId.clear();
  payeesByKey.clear();
}

/**
 * Returns `null` for transactions that cannot be resolved at all: an
 * unconfirmed one has no block to pick a consensus branch from, and an input
 * with no `output_hash` (a coinbase) has no prevout value to look up.
 */
function toRequest(tx: TX): TransactionDetailsRequest | null {
  const height = tx.block?.height;
  if (height === undefined || height === null) return null;

  const prevouts = [];
  for (const input of tx.inputs) {
    if (!input.output_hash) return null;
    prevouts.push({ txid: input.output_hash, index: input.output_index, value: input.value });
  }

  return { txid: tx.id, height, prevouts };
}

/**
 * Returns the transactions with accurate fees, plus the shielded payees found
 * along the way. Any transaction that could not be resolved keeps the fee it
 * came in with — an unknown fee must fall back to the explorer's guess, never
 * to zero — and contributes no payee.
 *
 * `ufvk` is the viewing key the payees are recovered with, and the scope they
 * are remembered under. Without one the fees still come back; the payees cannot
 * be asked for, and the transaction is asked again once a key is known.
 */
export async function resolveTransactionDetails(
  transactions: TX[],
  resolveDetails: DetailsResolver,
  ufvk?: string,
): Promise<ResolvedTransactions> {
  const isEstablished = (txid: string) =>
    feeByTxId.has(txid) && (ufvk === undefined || payeesByKey.has(payeeKey(txid, ufvk)));

  const toResolve = new Map<string, TransactionDetailsRequest>();
  for (const tx of transactions) {
    if (isEstablished(tx.id) || toResolve.has(tx.id)) continue;
    const request = toRequest(tx);
    if (request) toResolve.set(tx.id, request);
  }

  if (toResolve.size > 0) {
    try {
      const results = await resolveDetails([...toResolve.values()]);
      for (const { txid, fee, payees } of results) {
        feeByTxId.set(txid, fee);
        if (ufvk !== undefined) payeesByKey.set(payeeKey(txid, ufvk), payees);
      }
    } catch (error) {
      log(ZCASH_LOG_TYPE, "could not resolve transactions, keeping what the explorer reported", {
        requested: toResolve.size,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const payeesByTxId = new Map<string, string[]>();
  let correctedFees = 0;

  const priced = transactions.map(tx => {
    const payees = ufvk === undefined ? undefined : payeesByKey.get(payeeKey(tx.id, ufvk));
    if (payees?.length) payeesByTxId.set(tx.id, payees);

    const fee = feeByTxId.get(tx.id);
    if (fee === undefined || fee === null) return tx;

    // A fee that does not read as a finite number is not an answer: writing it
    // on the transaction would carry NaN into the operation value and on into
    // the balance, where it is far harder to trace back than a stale fee.
    const fees = Number(fee);
    if (!Number.isFinite(fees) || fees === tx.fees) return tx;

    correctedFees++;
    return { ...tx, fees };
  });

  if (correctedFees > 0 || payeesByTxId.size > 0) {
    log(ZCASH_LOG_TYPE, "recovered transaction details the explorer could not see", {
      correctedFees,
      withShieldedPayees: payeesByTxId.size,
      of: transactions.length,
    });
  }

  return { transactions: priced, payeesByTxId };
}
