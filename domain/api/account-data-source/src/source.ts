import type { AccountId } from "@domain/entity-account";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";

/** What a reader is asked about: the account, by its id and its descriptor. */
export type AccountTarget = {
  readonly accountId: AccountId;
  readonly descriptor: AccountDescriptor;
};

export type AccountDataReader<K extends AccountDatum> = (
  target: AccountTarget,
  query: AccountDataQuery<K> | undefined,
  signal?: AbortSignal,
) => Promise<AccountDataResult<K>>;

/**
 * Many accounts in one call. Answers one settled result per target, in the same order, so one
 * account failing does not fail the others.
 */
export type AccountDataBatchReader<K extends AccountDatum> = (
  targets: readonly AccountTarget[],
  query: AccountDataQuery<K> | undefined,
  signal?: AbortSignal,
) => Promise<PromiseSettledResult<AccountDataResult<K>>[]>;

/**
 * Whether an account has any history on chain: an operation or a balance. Cheaper than a read when
 * the source has a dedicated way to ask (an index lookup, a head request): that is the point of
 * having it apart from the readers.
 */
export type AccountExistence = (target: AccountTarget, signal?: AbortSignal) => Promise<boolean>;

/**
 * What a source implements: for each datum of `AccountData`, a single read named after it, a batch
 * read under `batch`, or both. A source serves what it can and leaves the rest out; the router falls
 * through to the next one, and makes up whichever of single or batch the source does not have.
 */
export type AccountDataSource = {
  readonly id: string;
  /**
   * Whether this source can answer `datum` for this account. Pure and synchronous, from the
   * descriptor alone; called only if the source has a reader for the datum.
   */
  supports(descriptor: AccountDescriptor, datum: AccountDatum): boolean;
  /** The most targets one batch call takes. The router splits a larger batch. */
  readonly maxBatchSize?: number;
  /** The most calls in flight on this source at once. Overrides the router's default. */
  readonly concurrency?: number;
  /** Whether this source can answer `exists` for this account. Pure, from the descriptor alone. */
  supportsExists?(descriptor: AccountDescriptor): boolean;
  /** The existence predicate, called with the source as `this`. See `AccountExistence`. */
  readonly exists?: AccountExistence;
  /** Batch readers, called with the source as `this`. */
  readonly batch?: { readonly [K in AccountDatum]?: AccountDataBatchReader<K> };
} & { readonly [K in AccountDatum]?: AccountDataReader<K> };
