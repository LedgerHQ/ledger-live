import type { AccountId } from "@domain/entity-account";

/**
 * The open map of account data. It knows no slice: each `account-*` entity adds its datum by
 * declaration merging.
 *
 * ```ts
 * declare module "@domain/entity-account-data" {
 *   interface AccountData {
 *     staking: { query: StakingQuery; result: StakingResult };
 *   }
 * }
 * ```
 */
// oxlint-disable-next-line typescript/no-empty-object-type
export interface AccountData {}

export type AccountDatum = keyof AccountData;

export type AccountDataQuery<K extends AccountDatum> = AccountData[K] extends { query: infer Q }
  ? Q
  : never;

export type AccountDataResult<K extends AccountDatum> = AccountData[K] extends { result: infer R }
  ? R
  : never;

/** Structural, so this package needs no Redux. */
export type AccountDataAction = { type: string };

/** How a slice receives one datum: the actions to dispatch and the selectors the generic thunk reads. */
export type AccountDataBinding<K extends AccountDatum, S> = {
  readonly datum: K;
  /** The query of a head read, i.e. the first page. */
  readonly headQuery: AccountDataQuery<K>;
  requested(accountId: AccountId): AccountDataAction;
  received(payload: {
    accountId: AccountId;
    data: AccountDataResult<K>;
    sourceId: string;
    append: boolean;
  }): AccountDataAction;
  failed(payload: { accountId: AccountId; error: string }): AccountDataAction;
  /** Epoch ms of the last head read, for freshness. */
  selectAt(state: S, accountId: AccountId): number | undefined;
  selectPending(state: S, accountId: AccountId): boolean;
  /** Paginated data only: the source that answered the head, so a cursor is never sent elsewhere. */
  selectSourceId?(state: S, accountId: AccountId): string | undefined;
  /** Paginated data only: when present, `loadMore` exists. */
  selectNextQuery?(state: S, accountId: AccountId): AccountDataQuery<K> | undefined;
};
