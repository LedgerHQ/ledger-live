import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountDataKind, AccountDataQuery, AccountDataResult } from "./registry";

/** Structural, so a slice's action creators fit without this package depending on Redux. */
export type AccountDataAction = { type: string };

export type AccountDataReceived<K extends AccountDataKind> = {
  accountUUID: AccountUUID;
  data: AccountDataResult<K>;
  sourceId: string;
  /** `true` for a next page, merged into what is stored; `false` for a head read, which replaces it. */
  append: boolean;
  /** ISO time of the read. */
  at: string;
};

export type AccountDataFailed = { accountUUID: AccountUUID; error: string };

/** What an entity gives the framework to read its data into its slice. */
export type AccountDataBinding<K extends AccountDataKind, S> = {
  readonly kind: K;
  requested(accountUUID: AccountUUID): AccountDataAction;
  received(payload: AccountDataReceived<K>): AccountDataAction;
  failed(payload: AccountDataFailed): AccountDataAction;
  /** When the data was last read, in ms since epoch, or `undefined` if never. */
  selectAt(state: S, accountUUID: AccountUUID): number | undefined;
  selectPending(state: S, accountUUID: AccountUUID): boolean;
  /** The source that last answered: a next page must come from it, a cursor means nothing elsewhere. */
  selectSourceId(state: S, accountUUID: AccountUUID): string | undefined;
  /** Only on a paginated kind: `query` moved to the next page, or `undefined` at the end. */
  selectNextQuery?(
    state: S,
    accountUUID: AccountUUID,
    query: AccountDataQuery<K> | undefined,
  ): AccountDataQuery<K> | undefined;
};
