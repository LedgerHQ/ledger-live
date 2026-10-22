import type {
  AccountDataKind,
  AccountDataQuery,
  AccountDataResult,
  AccountDataSourceId,
} from "@domain/entity-account-data";
import type { AccountDescriptor, AccountUUID } from "@domain/entity-account-descriptor";

export type AccountTarget = {
  readonly accountUUID: AccountUUID;
  readonly descriptor: AccountDescriptor;
  /** On a next page: the `nextCursor` this source put in the previous page. */
  readonly cursor?: string;
};

export type AccountDataReader<K extends AccountDataKind> = (
  target: AccountTarget,
  query: AccountDataQuery<K> | undefined,
) => Promise<AccountDataResult<K>>;

/** One settled result per target, in the same order, so one failing account does not fail the others. */
export type AccountDataBatchReader<K extends AccountDataKind> = (
  targets: readonly AccountTarget[],
  query: AccountDataQuery<K> | undefined,
) => Promise<PromiseSettledResult<AccountDataResult<K>>[]>;

/** Per kind, a single reader or a batch reader (only for a real multi-account call); with both, `readBatch` wins. */
export type AccountDataSource = {
  readonly id: AccountDataSourceId;
  /** Pure and synchronous, decided from the descriptor alone. Only asked when the source has a reader for `kind`. */
  supports(descriptor: AccountDescriptor, kind: AccountDataKind): boolean;
  readonly read?: { readonly [K in AccountDataKind]?: AccountDataReader<K> };
  readonly readBatch?: { readonly [K in AccountDataKind]?: AccountDataBatchReader<K> };
  /** The most targets one batch call takes; the router splits above it. */
  readonly maxBatchSize?: number;
  /** The most calls in flight on this source at once, overriding the router's default. */
  readonly concurrency?: number;
};
