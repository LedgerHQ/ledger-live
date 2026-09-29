import type { AccountRef } from "@domain/entity-account";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";
import { NoAccountSourceError } from "./errors";
import type { AccountDataMethod, AccountDataSource } from "./source";

export type AccountDataReadOptions = {
  signal?: AbortSignal;
  /** Only ask this source: a cursor is meaningful to the source that issued it, nobody else. */
  sourceId?: string;
};

export type AccountDataRouter = {
  read<K extends AccountDatum>(
    datum: K,
    ref: AccountRef,
    query: AccountDataQuery<K>,
    options?: AccountDataReadOptions,
  ): Promise<{ data: AccountDataResult<K>; sourceId: string }>;
};

// TypeScript cannot correlate a generic key with its mapped signature: this is the one place that says so.
function methodOf<K extends AccountDatum>(
  source: AccountDataSource,
  datum: K,
): AccountDataMethod<K> | undefined {
  return source[datum] as AccountDataMethod<K> | undefined;
}

/** The array order is the priority: first source that has the method and supports the account. */
export function createAccountDataRouter(sources: readonly AccountDataSource[]): AccountDataRouter {
  async function read<K extends AccountDatum>(
    datum: K,
    ref: AccountRef,
    query: AccountDataQuery<K>,
    { signal, sourceId }: AccountDataReadOptions = {},
  ): Promise<{ data: AccountDataResult<K>; sourceId: string }> {
    for (const source of sources) {
      if (sourceId !== undefined && source.id !== sourceId) continue;
      const method = methodOf(source, datum);
      if (!method || !source.supports(ref, datum)) continue;
      return { data: await method.call(source, ref, query, signal), sourceId: source.id };
    }
    throw new NoAccountSourceError(ref.accountId, datum);
  }
  return { read };
}
