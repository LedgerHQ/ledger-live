import type { AccountRef } from "@domain/entity-account";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";

export type AccountDataReader<K extends AccountDatum> = (
  ref: AccountRef,
  query: AccountDataQuery<K> | undefined,
  signal?: AbortSignal,
) => Promise<AccountDataResult<K>>;

/**
 * Many accounts in one call. Answers one settled result per ref, in the same order, so one account
 * failing does not fail the others.
 */
export type AccountDataBatchReader<K extends AccountDatum> = (
  refs: readonly AccountRef[],
  query: AccountDataQuery<K> | undefined,
  signal?: AbortSignal,
) => Promise<PromiseSettledResult<AccountDataResult<K>>[]>;

/**
 * What a source implements: for each datum of `AccountData`, a single read named after it, a batch
 * read under `batch`, or both. A source serves what it can and leaves the rest out; the router falls
 * through to the next one, and makes up whichever of single or batch the source does not have.
 */
export type AccountDataSource = {
  readonly id: string;
  /** Whether this source can answer `datum` for this account. Called only if it has a reader for it. */
  supports(ref: AccountRef, datum: AccountDatum): boolean;
  /** The most refs one batch call takes. The router splits a larger batch. */
  readonly maxBatchSize?: number;
  /** The most calls in flight on this source at once. Overrides the router's default. */
  readonly concurrency?: number;
  /** Batch readers, called with the source as `this`. */
  readonly batch?: { readonly [K in AccountDatum]?: AccountDataBatchReader<K> };
} & { readonly [K in AccountDatum]?: AccountDataReader<K> };
