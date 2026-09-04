import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountId } from "@shared/schema-primitives";
import { NoAccountBalanceSourceError } from "./errors";

/**
 * Everything a source needs in order to read a balance, with no dependency on the account model.
 *
 * Address-oriented rather than account-oriented on purpose: `getBalance(address)` needs no
 * `Account`, and requiring one would put us back where we started — unable to read a part of an
 * account without already holding all of it. Five strings, derivable from anything the app holds,
 * including a Ledger Sync descriptor that was never synced.
 */
export type AccountRef = {
  accountId: AccountId;
  currencyId: string;
  /** The xpub or address the account derives from. */
  address: string;
  derivationMode: string;
  /**
   * Set when the ref points at a token account.
   *
   * A token account's balance is **not** independently readable: one chain call returns every asset
   * held at an *address*, so a token row arrives with its parent's read. Sources take the main
   * account's ref, and reject a token one rather than key an account-wide replacement under a token
   * id — which would wipe the parent's row set.
   */
  parentId?: AccountId;
};

/**
 * One way of reading an account's balances.
 *
 * Registered at the app composition root, never imported by a screen — which is what lets a family
 * move from a full sync to a direct chain read without touching any UI.
 */
export type AccountBalanceSource = {
  /** Stable identity, recorded on the status so you can see which world answered. */
  readonly id: string;
  /**
   * Higher wins. The whole selection rule: the highest-priority source that supports this ref — new
   * world first when it is available, full sync otherwise.
   */
  readonly priority: number;
  /**
   * Can this source serve this ref at all — family supported, module capable, backend registered?
   *
   * A source that supports a ref in principle but is not ready for it yet (an indexer still warming
   * up) must answer `false` until it is, so a lower-priority source takes over instead of stalling.
   */
  supports(ref: AccountRef): boolean;
  /**
   * The account's own balance plus one row per token account it holds, as one atomic set.
   *
   * Partial sets are not expressible: chains report a token swept to zero by omitting it, so a
   * source that cannot enumerate every asset held would silently freeze a stale row.
   */
  getBalances(ref: AccountRef, signal?: AbortSignal): Promise<AccountBalance[]>;
};

/** The highest-priority source that supports this ref, or `undefined` when none does. */
export function pickSource(
  ref: AccountRef,
  sources: readonly AccountBalanceSource[],
): AccountBalanceSource | undefined {
  let best: AccountBalanceSource | undefined;
  for (const source of sources) {
    if (!source.supports(ref)) continue;
    if (!best || source.priority > best.priority) best = source;
  }
  return best;
}

/**
 * Read one account's balances through the best available source.
 *
 * A plain function, not a service and not a thunk: it is what wallet-cli calls with no Redux around
 * it, and what {@link fetchAccountBalance} calls with one.
 *
 * @throws {NoAccountBalanceSourceError} when nothing registered supports the ref.
 */
export async function readAccountBalances(
  ref: AccountRef,
  sources: readonly AccountBalanceSource[],
  signal?: AbortSignal,
): Promise<{ balances: AccountBalance[]; sourceId: string }> {
  const source = pickSource(ref, sources);
  if (!source) throw new NoAccountBalanceSourceError(ref.accountId);
  return { balances: await source.getBalances(ref, signal), sourceId: source.id };
}
