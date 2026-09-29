import type { AccountRef } from "@domain/entity-account";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";

/**
 * The single boundary with the implementations. One optional method per datum, named after it: a
 * source implements what it can and says so in `supports`. It imports no slice and no router.
 */
export type AccountDataMethod<K extends AccountDatum> = (
  ref: AccountRef,
  query: AccountDataQuery<K>,
  signal?: AbortSignal,
) => Promise<AccountDataResult<K>>;

export type AccountDataSource = {
  readonly id: string;
  supports(ref: AccountRef, datum: AccountDatum): boolean;
} & {
  readonly [K in AccountDatum]?: AccountDataMethod<K>;
};
