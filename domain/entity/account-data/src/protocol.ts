import type { AccountId } from "@domain/entity-account";

/**
 * What an account can be asked for, one key per datum. Empty on purpose: each
 * `@domain/entity-account-*` package declares its own key where its models live.
 *
 * ```ts
 * declare module "@domain/entity-account-data" {
 *   interface AccountData {
 *     balance: { query: undefined; result: AccountBalance[] };
 *   }
 * }
 * ```
 */
export interface AccountData {}

export type AccountDatum = keyof AccountData;

export type AccountDataQuery<K extends AccountDatum> = AccountData[K] extends { query: infer Q }
  ? Q
  : never;

export type AccountDataResult<K extends AccountDatum> = AccountData[K] extends { result: infer R }
  ? R
  : never;

/** Structural, so a slice's action creators fit without this package depending on Redux. */
export type AccountDataAction = { type: string };

export type AccountDataReceived<K extends AccountDatum> = {
  accountId: AccountId;
  data: AccountDataResult<K>;
  sourceId: string;
  /** `true` for a next page: merge into what is there. `false` for a head read: replace it. */
  append: boolean;
  /** ISO time of the read. */
  at: string;
};

/**
 * How a slice takes part in a read. The slice exposes this once; the generic thunk and hook drive
 * any datum through it, so no read logic is written per slice.
 */
export type AccountDataBinding<K extends AccountDatum, S = never> = {
  readonly datum: K;
  requested(accountId: AccountId): AccountDataAction;
  received(payload: AccountDataReceived<K>): AccountDataAction;
  failed(payload: { accountId: AccountId; error: string }): AccountDataAction;
  /** When the datum was last read, in ms since epoch, or `undefined` if never. */
  selectAt(state: S, accountId: AccountId): number | undefined;
  selectPending(state: S, accountId: AccountId): boolean;
  /** The source that last answered. A next page must come from it: a cursor means nothing elsewhere. */
  selectSourceId(state: S, accountId: AccountId): string | undefined;
  /** Present only on a paginated datum: the query for the next page, or `undefined` at the end. */
  selectNextQuery?(state: S, accountId: AccountId): AccountDataQuery<K> | undefined;
};
