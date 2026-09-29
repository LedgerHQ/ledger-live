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
 * What a source implements: one optional method per datum of `AccountData`, named after it. A source
 * serves what it can and leaves the rest out; the router falls through to the next one.
 */
export type AccountDataSource = {
  readonly id: string;
  /** Whether this source can answer `datum` for this account. Called only if the method exists. */
  supports(ref: AccountRef, datum: AccountDatum): boolean;
} & { readonly [K in AccountDatum]?: AccountDataReader<K> };
