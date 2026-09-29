import type { AccountRef } from "@domain/entity-account";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";
import { NoAccountSourceError } from "./errors";
import type { AccountDataReader, AccountDataSource } from "./source";

export type AccountDataReadOptions = {
  signal?: AbortSignal;
  /** Only this source may answer: a cursor handed out by one source means nothing to another. */
  sourceId?: string;
};

export type AccountDataRouter = {
  read<K extends AccountDatum>(
    datum: K,
    ref: AccountRef,
    query?: AccountDataQuery<K>,
    options?: AccountDataReadOptions,
  ): Promise<{ data: AccountDataResult<K>; sourceId: string }>;
};

/** The sources in the order the app ranks them: the first that can answer does. */
export function createAccountDataRouter(sources: readonly AccountDataSource[]): AccountDataRouter {
  const ranked = [...sources];

  return {
    async read(datum, ref, query, { signal, sourceId } = {}) {
      const source = ranked.find(
        candidate =>
          (sourceId === undefined || candidate.id === sourceId) &&
          typeof candidate[datum] === "function" &&
          candidate.supports(ref, datum),
      );
      if (!source) throw new NoAccountSourceError(ref.accountId, datum, sourceId);
      // Called on the source so a class-based source keeps its `this`.
      const reader = source[datum] as AccountDataReader<typeof datum>;
      return { data: await reader.call(source, ref, query, signal), sourceId: source.id };
    },
  };
}
