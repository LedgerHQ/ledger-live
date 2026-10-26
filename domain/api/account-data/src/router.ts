import type {
  AccountDataKind,
  AccountDataQuery,
  AccountDataResult,
  AccountDataSourceId,
} from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { addSource, coalesce, createRouterContext } from "./internals/router";
import type { AccountDataSource } from "./source";

/** As many calls in flight per source as the legacy sync queue allows by default. */
export const DEFAULT_ACCOUNT_DATA_CONCURRENCY = 4;

export type AccountDataReadOptions<K extends AccountDataKind> = {
  query?: AccountDataQuery<K>;
  /** Only this source may answer: a cursor handed out by one source means nothing to another. */
  sourceId?: AccountDataSourceId;
  /** Read the page after the one that handed out this cursor. */
  cursor?: string;
};

export type AccountDataAnswer<K extends AccountDataKind> = {
  data: AccountDataResult<K>;
  sourceId: AccountDataSourceId;
};

export type AccountDataRouter = {
  /** One account. Reads of the same kind, query and source issued in the same tick are read together. */
  read<K extends AccountDataKind>(
    kind: K,
    descriptor: AccountDescriptor,
    options?: AccountDataReadOptions<K>,
  ): Promise<AccountDataAnswer<K>>;
  /** Ranks a source loaded on demand last, or in place of the one sharing its id, for reads not routed yet; returns its remover. */
  addSource(source: AccountDataSource): () => void;
};

export type AccountDataRouterOptions = {
  /** Calls in flight per source, when the source does not set its own. */
  concurrency?: number;
};
/**
 * Creates the router of an app's ranked sources.
 *
 * Reads issued in one tick for the same kind, query and pinned source are coalesced, then routed
 * together: each account goes to the first ranked source with a reader for the kind that supports
 * it, each source reads its accounts in one call per chunk or one call per account, at most
 * `concurrency` calls at once, and every caller gets its own answer as soon as its call settles.
 *
 * The body only wires the context to `./internals/router`.
 */
export function createAccountDataRouter(
  sources: readonly AccountDataSource[],
  { concurrency = DEFAULT_ACCOUNT_DATA_CONCURRENCY }: AccountDataRouterOptions = {},
): AccountDataRouter {
  const context = createRouterContext(sources, concurrency);
  return {
    async read(kind, descriptor, options = {}) {
      const batch = coalesce(context, kind, options);
      const index = batch.reads.push({ descriptor, cursor: options.cursor }) - 1;
      const answers = await batch.answers;
      const own = await answers[index];
      if (own.status === "rejected") throw own.reason;
      return own.value;
    },
    addSource: source => addSource(context, source),
  };
}
