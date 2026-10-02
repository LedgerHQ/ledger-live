import { accountRefKey, type AccountRef } from "@domain/entity-account";
import type {
  AccountDataQuery,
  AccountDataResult,
  AccountDatum,
} from "@domain/entity-account-data";
import { NoAccountSourceError } from "./errors";
import type { AccountDataBatchReader, AccountDataReader, AccountDataSource } from "./source";

/** As many calls in flight per source as the legacy sync queue allows by default. */
export const DEFAULT_ACCOUNT_DATA_CONCURRENCY = 4;

export type AccountDataReadOptions = {
  signal?: AbortSignal;
  /** Only this source may answer: a cursor handed out by one source means nothing to another. */
  sourceId?: string;
};

export type AccountDataRead<K extends AccountDatum> = {
  data: AccountDataResult<K>;
  sourceId: string;
};

export type AccountDataRouter = {
  /** One account. Reads issued in the same tick are merged into one batch per source. */
  read<K extends AccountDatum>(
    datum: K,
    ref: AccountRef,
    query?: AccountDataQuery<K>,
    options?: AccountDataReadOptions,
  ): Promise<AccountDataRead<K>>;
  /** Many accounts, one settled result per ref, in the same order. */
  readBatch<K extends AccountDatum>(
    datum: K,
    refs: readonly AccountRef[],
    query?: AccountDataQuery<K>,
    options?: AccountDataReadOptions,
  ): Promise<PromiseSettledResult<AccountDataRead<K>>[]>;
};

export type AccountDataRouterOptions = {
  /** Merge single reads issued in the same tick into one batch per source. Defaults to `true`. */
  coalesce?: boolean;
  /** Calls in flight per source, when the source does not set its own. */
  concurrency?: number;
};

type Settled<T> = PromiseSettledResult<T>;
type Limiter = <T>(task: () => Promise<T>, signal?: AbortSignal) => Promise<T>;

const abortError = () => new DOMException("aborted", "AbortError");

/** At most `limit` tasks running; the rest wait their turn, or leave the queue when aborted. */
function createLimiter(limit: number): Limiter {
  let active = 0;
  const queue: Array<() => void> = [];

  function release() {
    const next = queue.shift();
    if (next) next();
    else active--;
  }

  return async function run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw abortError();
    if (active < limit) {
      active++;
    } else {
      // The slot is handed over by `release`, so `active` is not touched on the way in.
      await new Promise<void>((resolve, reject) => {
        const start = () => {
          signal?.removeEventListener("abort", onAbort);
          resolve();
        };
        const onAbort = () => {
          const index = queue.indexOf(start);
          if (index >= 0) queue.splice(index, 1);
          reject(abortError());
        };
        queue.push(start);
        signal?.addEventListener("abort", onAbort, { once: true });
      });
    }
    try {
      return await task();
    } finally {
      release();
    }
  };
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size));
  }
  return chunks;
}

// Key order is not meaning: `{ cursor, limit }` and `{ limit, cursor }` ask the same question.
function stableKey(value: unknown): string {
  if (value === undefined) return "";
  return JSON.stringify(value, (_key, nested: unknown) =>
    nested && typeof nested === "object" && !Array.isArray(nested)
      ? Object.fromEntries(
          Object.entries(nested).sort(([a], [b]) => {
            if (a < b) return -1;
            return a > b ? 1 : 0;
          }),
        )
      : nested,
  );
}

function stopWaitingOnAbort<T>(answer: Promise<T>, signal: AbortSignal): Promise<T> {
  let onAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(abortError());
    signal.addEventListener("abort", onAbort, { once: true });
  });
  return Promise.race([answer, aborted]).finally(() =>
    signal.removeEventListener("abort", onAbort),
  );
}

function serves(source: AccountDataSource, datum: AccountDatum): boolean {
  return typeof source[datum] === "function" || typeof source.batch?.[datum] === "function";
}

type Waiter = {
  ref: AccountRef;
  resolve: (read: AccountDataRead<AccountDatum>) => void;
  reject: (reason: unknown) => void;
};

type Pending = {
  datum: AccountDatum;
  query: unknown;
  sourceId?: string;
  waiters: Waiter[];
};

/**
 * The sources in the order the app ranks them. For each account, the first source that has a
 * reader for the datum and supports the account answers. Accounts answered by the same source are
 * read together: one batch call per chunk when the source has a batch reader, otherwise its single
 * reader once per account. Either way no more than `concurrency` calls are in flight on that source.
 */
export function createAccountDataRouter(
  sources: readonly AccountDataSource[],
  {
    coalesce = true,
    concurrency = DEFAULT_ACCOUNT_DATA_CONCURRENCY,
  }: AccountDataRouterOptions = {},
): AccountDataRouter {
  const ranked = [...sources];
  const limiters = new Map<AccountDataSource, Limiter>();
  const pending = new Map<string, Pending>();

  function limiterOf(source: AccountDataSource): Limiter {
    let limiter = limiters.get(source);
    if (!limiter) {
      limiter = createLimiter(Math.max(1, source.concurrency ?? concurrency));
      limiters.set(source, limiter);
    }
    return limiter;
  }

  async function readFromSource<K extends AccountDatum>(
    source: AccountDataSource,
    datum: K,
    refs: readonly AccountRef[],
    query: AccountDataQuery<K> | undefined,
    signal: AbortSignal | undefined,
  ): Promise<Settled<AccountDataResult<K>>[]> {
    const run = limiterOf(source);
    const batch = source.batch?.[datum] as AccountDataBatchReader<K> | undefined;

    if (!batch) {
      const single = source[datum] as AccountDataReader<K>;
      return Promise.allSettled(
        refs.map(ref => run(() => single.call(source, ref, query, signal), signal)),
      );
    }

    const parts = chunk(refs, Math.max(1, source.maxBatchSize ?? refs.length));
    const answered = await Promise.all(
      parts.map(async (part): Promise<Settled<AccountDataResult<K>>[]> => {
        try {
          const answers = await run(() => batch.call(source, part, query, signal), signal);
          if (answers.length !== part.length) {
            throw new Error(
              `Source "${source.id}" answered ${answers.length} results for ${part.length} accounts`,
            );
          }
          return answers;
        } catch (reason) {
          // A whole call failing fails its accounts; it is not retried one by one.
          return part.map(() => ({ status: "rejected", reason }));
        }
      }),
    );
    return answered.flat();
  }

  async function route<K extends AccountDatum>(
    datum: K,
    refs: readonly AccountRef[],
    query: AccountDataQuery<K> | undefined,
    { signal, sourceId }: AccountDataReadOptions,
  ): Promise<Settled<AccountDataRead<K>>[]> {
    const results: Settled<AccountDataRead<K>>[] = new Array(refs.length);
    const groups = new Map<AccountDataSource, number[]>();

    refs.forEach((ref, index) => {
      const source = ranked.find(
        candidate =>
          (sourceId === undefined || candidate.id === sourceId) &&
          serves(candidate, datum) &&
          candidate.supports(ref, datum),
      );
      if (!source) {
        results[index] = {
          status: "rejected",
          reason: new NoAccountSourceError(ref.accountId, datum, sourceId),
        };
        return;
      }
      const group = groups.get(source);
      if (group) group.push(index);
      else groups.set(source, [index]);
    });

    await Promise.all(
      [...groups].map(async ([source, indexes]) => {
        const answers = await readFromSource(
          source,
          datum,
          indexes.map(index => refs[index]),
          query,
          signal,
        );
        answers.forEach((answer, position) => {
          results[indexes[position]] =
            answer.status === "fulfilled"
              ? { status: "fulfilled", value: { data: answer.value, sourceId: source.id } }
              : answer;
        });
      }),
    );
    return results;
  }

  /** Reads each distinct ref once, and hands the same answer to every duplicate. */
  async function readEach<K extends AccountDatum>(
    datum: K,
    refs: readonly AccountRef[],
    query: AccountDataQuery<K> | undefined,
    options: AccountDataReadOptions,
  ): Promise<Settled<AccountDataRead<K>>[]> {
    const unique: AccountRef[] = [];
    const positionOf = new Map<string, number>();
    for (const ref of refs) {
      const key = accountRefKey(ref);
      if (!positionOf.has(key)) {
        positionOf.set(key, unique.length);
        unique.push(ref);
      }
    }
    const answers = await route(datum, unique, query, options);
    return refs.map(ref => answers[positionOf.get(accountRefKey(ref)) as number]);
  }

  async function flush(key: string): Promise<void> {
    const batch = pending.get(key);
    pending.delete(key);
    if (!batch) return;
    try {
      const refs = batch.waiters.map(waiter => waiter.ref);
      const answers = await readEach(
        batch.datum,
        refs,
        batch.query as AccountDataQuery<AccountDatum>,
        { sourceId: batch.sourceId },
      );
      batch.waiters.forEach((waiter, index) => {
        const answer = answers[index];
        if (answer.status === "fulfilled") waiter.resolve(answer.value);
        else waiter.reject(answer.reason);
      });
    } catch (error) {
      for (const waiter of batch.waiters) waiter.reject(error);
    }
  }

  return {
    async read(datum, ref, query, options = {}) {
      if (options.signal?.aborted) throw abortError();
      if (!coalesce) {
        const [answer] = await readEach(datum, [ref], query, options);
        if (answer.status === "rejected") throw answer.reason;
        return answer.value;
      }

      // Merged reads share one call, so a caller's signal stops that caller waiting and nothing more.
      const key = [datum, options.sourceId ?? "", stableKey(query)].join("\u0000");
      let batch = pending.get(key);
      if (!batch) {
        batch = { datum, query, sourceId: options.sourceId, waiters: [] };
        pending.set(key, batch);
        queueMicrotask(() => void flush(key));
      }
      const waiters = batch.waiters;
      const answer = new Promise<AccountDataRead<AccountDatum>>((resolve, reject) =>
        waiters.push({ ref, resolve, reject }),
      ) as Promise<AccountDataRead<typeof datum>>;
      return options.signal ? stopWaitingOnAbort(answer, options.signal) : answer;
    },

    async readBatch(datum, refs, query, options = {}) {
      if (options.signal?.aborted) throw abortError();
      return readEach(datum, refs, query, options);
    },
  };
}
