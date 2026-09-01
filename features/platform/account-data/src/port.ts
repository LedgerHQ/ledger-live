import type { AccountBalance } from "@domain/entity-account-balance";
import type { AccountId } from "@shared/schema-primitives";

/**
 * The unit of demand. One name per account entity table, so a screen can say what it needs instead
 * of asking for a whole account.
 *
 * The full vocabulary is declared up front — a source's `capabilities` / `deliveries` sets and the
 * router's set-cover are already correct for slices no source serves yet, so adding `operations`
 * later is a new source method and a new `SliceUpdate` variant, not a change to the routing.
 */
export const ACCOUNT_SLICES = [
  "core",
  "balance",
  "operations",
  "balanceHistory",
  "staking",
  "resources",
] as const;

export type AccountSlice = (typeof ACCOUNT_SLICES)[number];

/**
 * Everything a source needs in order to fetch, with no dependency on the account model.
 *
 * Address-oriented rather than account-oriented on purpose: `getBalance(address)` needs no
 * `Account`, and requiring one would put us back where we started — unable to read a part of an
 * account without already holding all of it.
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
   * Note for the `balance` slice: it is **not** independently servable on a token account. A chain
   * returns every asset held at an address in one call, so a token account's balance arrives as part
   * of its parent's read — request `balance` on the parent ref and read the token rows from
   * `subAccountBalancesSelector`. Sources reject a token ref for `balance` rather than key an
   * account-wide replacement under a token id, which would corrupt the parent's row set.
   */
  parentId?: AccountId;
};

export type FetchRequest = {
  ref: AccountRef;
  slices: readonly AccountSlice[];
  /** Analytics and debuggability, mirroring `BridgeSync`'s `reason` today. */
  reason: string;
  signal?: AbortSignal;
};

/**
 * One slice's worth of fresh data. A source emits these as they resolve rather than once at the end,
 * so a balance that took 80ms is not held hostage by an operation page that takes 900ms.
 */
export type SliceUpdate = {
  slice: "balance";
  accountId: AccountId;
  /**
   * The account's own balance plus one row per token account, as one atomic set. Partial sets are
   * not expressible here: chains report a token swept to zero by omitting it, so a source that
   * cannot enumerate every asset held would silently freeze a stale row.
   */
  balances: AccountBalance[];
};

/**
 * One way of obtaining account data. Registered at the app composition root, never imported by a
 * screen — which is what lets a family be moved from a full sync to a direct chain read without
 * touching any UI.
 */
export type AccountDataSource = {
  /** Stable identity, recorded on the data it writes so divergence between sources is traceable. */
  readonly id: string;
  /** Higher wins when several sources can serve the same slice. */
  readonly priority: number;

  /**
   * Can this source serve `ref` at all — family supported, config enabled, backend registered?
   * A source that supports a ref in principle but is not ready for it yet (an indexer still
   * warming up, say) must answer `false` until it is, so the router falls back instead of stalling.
   */
  supports(ref: AccountRef): boolean;

  /**
   * Slices this source can fetch **independently**: asking for one does not pay for the others.
   *
   * A full-sync source declares the empty set — it can serve everything, but never cheaply, so it
   * must never be *selected* for a slice. It only ever covers the remainder.
   */
  capabilities(ref: AccountRef): ReadonlySet<AccountSlice>;

  /**
   * Slices this source **will** emit whenever it runs, whatever was asked. Always a superset of
   * `capabilities`.
   *
   * This is the load-bearing part of the contract. A full sync produces every slice as a side
   * effect, and the router subtracts *deliveries* — not capabilities — from what is still wanted.
   * That is what collapses "balance from the chain + resources from a sync" into a single sync
   * instead of paying for both.
   */
  deliveries(ref: AccountRef): ReadonlySet<AccountSlice>;

  /**
   * Fetch, emitting each slice as it resolves.
   *
   * Over-delivering is legal and expected. Under-delivering is a bug: if a requested slice is in
   * `capabilities(ref)`, this must emit it or throw.
   */
  fetch(request: FetchRequest): AsyncIterable<SliceUpdate>;
};

/** Freshness and outcome of one `(account, slice)` pair. Ephemeral — never persisted. */
export type SliceStatus = {
  pending: boolean;
  error?: Error;
  /** Epoch ms of the last successful fetch; `undefined` while never fetched. */
  lastFetchedAt?: number;
  /** Id of the source that last wrote this slice. */
  sourceId?: string;
};

export const IDLE_SLICE_STATUS: SliceStatus = { pending: false };
