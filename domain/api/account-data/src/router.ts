import type {
  AccountDataKind,
  AccountDataQuery,
  AccountDataResult,
} from "@domain/entity-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { NoAccountDataSourceError } from "./errors";
import { chunk, createLimiter, type Limiter } from "./router.internals";
import { accountDataQueryKey } from "./queryKey";
import type { AccountDataSource, AccountTarget } from "./source";

/** As many calls in flight per source as the legacy sync queue allows by default. */
export const DEFAULT_ACCOUNT_DATA_CONCURRENCY = 4;

export type AccountDataReadOptions<K extends AccountDataKind> = {
  query?: AccountDataQuery<K>;
  /** Only this source may answer: a cursor handed out by one source means nothing to another. */
  sourceId?: string;
  /** Read the page after the one that handed out this cursor. */
  cursor?: string;
};

export type AccountDataAnswer<K extends AccountDataKind> = {
  data: AccountDataResult<K>;
  sourceId: string;
};

export type AccountDataRouter = {
  /** One account. Reads of the same kind, query and source issued in the same tick are read together. */
  read<K extends AccountDataKind>(
    kind: K,
    descriptor: AccountDescriptor,
    options?: AccountDataReadOptions<K>,
  ): Promise<AccountDataAnswer<K>>;
};

export type AccountDataRouterOptions = {
  /** Calls in flight per source, when the source does not set its own. */
  concurrency?: number;
};

type Settled<T> = PromiseSettledResult<T>;

/** One answer per target, each settling as soon as its own call does. */
type Answers<T> = Promise<Settled<T>>[];

type Pending = { descriptor: AccountDescriptor; cursor?: string };

type Coalesced<K extends AccountDataKind> = {
  reads: Pending[];
  answers: Promise<Answers<AccountDataAnswer<K>>>;
};

const settled = <T>(promise: Promise<T>): Promise<Settled<T>> =>
  promise.then(
    value => ({ status: "fulfilled", value }),
    (reason: unknown) => ({ status: "rejected", reason }),
  );

const rejected = <T>(reason: unknown): Promise<Settled<T>> =>
  Promise.resolve({ status: "rejected", reason });

function serves(source: AccountDataSource, kind: AccountDataKind): boolean {
  return source.read?.[kind] !== undefined || source.readBatch?.[kind] !== undefined;
}

/** Routes each account to the first ranked source with a reader for the kind that supports it, batched and capped per source. */
export function createAccountDataRouter(
  sources: readonly AccountDataSource[],
  { concurrency = DEFAULT_ACCOUNT_DATA_CONCURRENCY }: AccountDataRouterOptions = {},
): AccountDataRouter {
  const ranked = [...sources];
  const limiters = new Map<AccountDataSource, Limiter>();
  const coalescing = new Map<string, Coalesced<AccountDataKind>>();

  function limiterOf(source: AccountDataSource): Limiter {
    let limiter = limiters.get(source);
    if (!limiter) {
      limiter = createLimiter(Math.max(1, source.concurrency ?? concurrency));
      limiters.set(source, limiter);
    }
    return limiter;
  }

  function readFromSource<K extends AccountDataKind>(
    source: AccountDataSource,
    kind: K,
    targets: readonly AccountTarget[],
    query: AccountDataQuery<K> | undefined,
  ): Answers<AccountDataResult<K>> {
    const run = limiterOf(source);
    const batch = source.readBatch?.[kind];
    const single = source.read?.[kind];

    if (!batch) {
      if (!single) {
        const reason = new Error(`Source "${source.id}" has no reader for ${kind}`);
        return targets.map(() => rejected(reason));
      }
      return targets.map(target => settled(run(() => single(target, query))));
    }

    const parts = chunk(targets, Math.max(1, source.maxBatchSize ?? targets.length));
    return parts.flatMap(part => {
      const answered = run(() => batch(part, query)).then(answers => {
        if (answers.length !== part.length) {
          throw new Error(
            `Source "${source.id}" answered ${answers.length} results for ${part.length} accounts`,
          );
        }
        return answers;
      });
      // A failed call fails its chunk; retrying account by account would turn an outage into a storm.
      return part.map((_target, index) =>
        answered.then(
          answers => answers[index],
          (reason: unknown): Settled<AccountDataResult<K>> => ({ status: "rejected", reason }),
        ),
      );
    });
  }

  /** Routes each distinct read to its source, and hands the same answer to every duplicate. */
  function route<K extends AccountDataKind>(
    kind: K,
    reads: readonly Pending[],
    { query, sourceId }: AccountDataReadOptions<K>,
  ): Answers<AccountDataAnswer<K>> {
    const targets = new Map<string, AccountTarget>();
    // A read that cannot even be routed fails alone, not the reads it was coalesced with.
    const keys = reads.map(({ descriptor, cursor }) => {
      let accountUUID;
      try {
        accountUUID = computeAccountUUID(descriptor);
      } catch (error) {
        return rejected<AccountDataAnswer<K>>(error);
      }
      const key = JSON.stringify([accountUUID, cursor ?? null]);
      if (!targets.has(key)) {
        targets.set(key, { accountUUID, descriptor, cursor });
      }
      return key;
    });

    const answers = new Map<string, Promise<Settled<AccountDataAnswer<K>>>>();
    const groups = new Map<AccountDataSource, [string, AccountTarget][]>();
    for (const [key, target] of targets) {
      let source;
      try {
        source = ranked.find(
          candidate =>
            (sourceId === undefined || candidate.id === sourceId) &&
            serves(candidate, kind) &&
            candidate.supports(target.descriptor, kind),
        );
      } catch (error) {
        answers.set(key, rejected(error));
        continue;
      }
      if (source) {
        const group = groups.get(source);
        if (group) group.push([key, target]);
        else groups.set(source, [[key, target]]);
      } else {
        answers.set(
          key,
          rejected(new NoAccountDataSourceError(target.accountUUID, kind, sourceId)),
        );
      }
    }

    for (const [source, group] of groups) {
      const results = readFromSource(
        source,
        kind,
        group.map(([, target]) => target),
        query,
      );
      results.forEach((result, index) => {
        answers.set(
          group[index][0],
          result.then(answer =>
            answer.status === "fulfilled"
              ? { status: "fulfilled", value: { data: answer.value, sourceId: source.id } }
              : answer,
          ),
        );
      });
    }
    return keys.map(key => {
      if (typeof key !== "string") return key;
      const answer = answers.get(key);
      if (!answer) throw new Error(`No answer was recorded for ${key}`);
      return answer;
    });
  }

  function coalesce<K extends AccountDataKind>(
    kind: K,
    options: AccountDataReadOptions<K>,
  ): Coalesced<K> {
    const key = [kind, options.sourceId ?? "", accountDataQueryKey(options.query)].join("\u0000");
    // The key holds the kind, so what is stored under it was built for this very `K`.
    const existing = coalescing.get(key) as Coalesced<K> | undefined;
    if (existing) return existing;
    const reads: Pending[] = [];
    const answers = Promise.resolve().then(() => {
      coalescing.delete(key);
      return route(kind, reads, options);
    });
    const created: Coalesced<K> = { reads, answers };
    coalescing.set(key, created);
    return created;
  }

  return {
    async read(kind, descriptor, options = {}) {
      const batch = coalesce(kind, options);
      const index = batch.reads.push({ descriptor, cursor: options.cursor }) - 1;
      const answers = await batch.answers;
      const own = await answers[index];
      if (own.status === "rejected") throw own.reason;
      return own.value;
    },
  };
}
