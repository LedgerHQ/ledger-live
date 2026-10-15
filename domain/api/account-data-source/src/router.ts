import type {
  AccountDataKind,
  AccountDataQuery,
  AccountDataResult,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { AccountDataAbortedError, NoAccountDataSourceError } from "./errors";
import { chunk, createLimiter, stopWaitingOnAbort, type Limiter } from "./router.internals";
import { accountDataQueryKey } from "./queryKey";
import type { AccountDataSource, AccountTarget } from "./source";

/** As many calls in flight per source as the legacy sync queue allows by default. */
export const DEFAULT_ACCOUNT_DATA_CONCURRENCY = 4;

export type AccountDataReadOptions<K extends AccountDataKind> = {
  query?: AccountDataQuery<K>;
  signal?: AbortSignal;
  /** Only this source may answer: a cursor handed out by one source means nothing to another. */
  sourceId?: string;
};

export type AccountDataRead<K extends AccountDataKind> = {
  data: AccountDataResult<K>;
  sourceId: string;
};

export type AccountDataRouter = {
  /** One account. Reads of the same kind and query issued in the same tick are read together. */
  read<K extends AccountDataKind>(
    kind: K,
    descriptor: AccountDescriptor,
    options?: AccountDataReadOptions<K>,
  ): Promise<AccountDataRead<K>>;
  /** Many accounts: one settled result per descriptor, in the same order. */
  readBatch<K extends AccountDataKind>(
    kind: K,
    descriptors: readonly AccountDescriptor[],
    options?: AccountDataReadOptions<K>,
  ): Promise<PromiseSettledResult<AccountDataRead<K>>[]>;
};

export type AccountDataRouterOptions = {
  /** Calls in flight per source, when the source does not set its own. */
  concurrency?: number;
};

type Settled<T> = PromiseSettledResult<T>;

/** One answer per account, each settling as soon as its own call does. */
type Answers<T> = Promise<Settled<T>>[];

type Coalesced<K extends AccountDataKind> = {
  descriptors: AccountDescriptor[];
  answers: Promise<Answers<AccountDataRead<K>>>;
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
    signal: AbortSignal | undefined,
  ): Answers<AccountDataResult<K>> {
    const run = limiterOf(source);
    const batch = source.readBatch?.[kind];
    const single = source.read?.[kind];

    if (!batch) {
      if (!single) {
        const reason = new Error(`Source "${source.id}" has no reader for ${kind}`);
        return targets.map(() => rejected(reason));
      }
      return targets.map(target => settled(run(() => single(target, query, signal), signal)));
    }

    const parts = chunk(targets, Math.max(1, source.maxBatchSize ?? targets.length));
    return parts.flatMap(part => {
      const answered = run(() => batch(part, query, signal), signal).then(answers => {
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

  /** Routes each distinct account to its source, and hands the same answer to every duplicate. */
  function route<K extends AccountDataKind>(
    kind: K,
    descriptors: readonly AccountDescriptor[],
    { query, signal, sourceId }: AccountDataReadOptions<K>,
  ): Answers<AccountDataRead<K>> {
    const targets = new Map<AccountUUID, AccountTarget>();
    const keys = descriptors.map(descriptor => {
      const accountUUID = computeAccountUUID(descriptor);
      if (!targets.has(accountUUID)) targets.set(accountUUID, { accountUUID, descriptor });
      return accountUUID;
    });

    const answers = new Map<AccountUUID, Promise<Settled<AccountDataRead<K>>>>();
    const groups = new Map<AccountDataSource, AccountTarget[]>();
    for (const target of targets.values()) {
      const source = ranked.find(
        candidate =>
          (sourceId === undefined || candidate.id === sourceId) &&
          serves(candidate, kind) &&
          candidate.supports(target.descriptor, kind),
      );
      if (source) {
        const group = groups.get(source);
        if (group) group.push(target);
        else groups.set(source, [target]);
      } else {
        answers.set(
          target.accountUUID,
          rejected(new NoAccountDataSourceError(target.accountUUID, kind, sourceId)),
        );
      }
    }

    for (const [source, group] of groups) {
      readFromSource(source, kind, group, query, signal).forEach((result, index) => {
        answers.set(
          group[index].accountUUID,
          result.then(answer =>
            answer.status === "fulfilled"
              ? { status: "fulfilled", value: { data: answer.value, sourceId: source.id } }
              : answer,
          ),
        );
      });
    }
    return keys.map(key => {
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
    const descriptors: AccountDescriptor[] = [];
    const answers = Promise.resolve().then(() => {
      coalescing.delete(key);
      return route(kind, descriptors, { query: options.query, sourceId: options.sourceId });
    });
    const created: Coalesced<K> = { descriptors, answers };
    coalescing.set(key, created);
    return created;
  }

  return {
    async read(kind, descriptor, options = {}) {
      if (options.signal?.aborted) throw new AccountDataAbortedError();
      const batch = coalesce(kind, options);
      const index = batch.descriptors.push(descriptor) - 1;
      // Coalesced reads share one call: a caller's signal stops that caller waiting, and nothing more.
      const answer = batch.answers.then(async answers => {
        const own = await answers[index];
        if (own.status === "rejected") throw own.reason;
        return own.value;
      });
      return options.signal ? stopWaitingOnAbort(answer, options.signal) : answer;
    },

    async readBatch(kind, descriptors, options = {}) {
      if (options.signal?.aborted) throw new AccountDataAbortedError();
      return Promise.all(route(kind, descriptors, options));
    },
  };
}
