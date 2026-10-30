import {
  accountDataQueryKey,
  type AccountDataKind,
  type AccountDataQuery,
  type AccountDataResult,
  type AccountDataSourceId,
} from "@domain/entity-account-data";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { NoAccountDataSourceError } from "../errors";
import type {
  AccountDataAnswer,
  AccountDataReadOptions,
  AddAccountDataSourceOptions,
} from "../router";
import type {
  AccountDataBatchReader,
  AccountDataReader,
  AccountDataSource,
  AccountTarget,
} from "../source";
import { chunk, createLimiter, type Limiter } from "./limiter";

export type Settled<T> = PromiseSettledResult<T>;

/** One answer per target, each settling as soon as its own call does. */
export type Answers<T> = Promise<Settled<T>>[];

/** A read waiting for its tick to be routed. */
export type PendingRead = { descriptor: AccountDescriptor; cursor?: string };

/** The reads of one tick that share a kind, a query and a pinned source, and their answers. */
export type Coalesced<K extends AccountDataKind> = {
  reads: PendingRead[];
  answers: Promise<Answers<AccountDataAnswer<K>>>;
};

/** What a router keeps between reads: its ranked sources, a limiter per source, the reads of the tick. */
export type RouterContext = {
  ranked: AccountDataSource[];
  /** Calls in flight per source, when the source does not set its own. */
  concurrency: number;
  limiters: WeakMap<AccountDataSource, Limiter>;
  /** The registrations under an id not removed yet, in order: the latest answers. */
  stacks: Map<AccountDataSourceId, Registration[]>;
  /** The next rank keys handed out: below every other for `first`, above every other otherwise. */
  nextFirst: number;
  nextLast: number;
  coalescing: Map<string, Coalesced<AccountDataKind>>;
};

/** One registration: a source added twice has two, removed each on its own; `rank` orders ids. */
type Registration = { source: AccountDataSource; rank: number };

/** Where a read lands among the targets: its target's key, or its own failure when it cannot be routed. */
export type ReadSlot = { key: string } | { failure: unknown };

type Group = { key: string; target: AccountTarget };

export function createRouterContext(
  sources: readonly AccountDataSource[],
  concurrency: number,
): RouterContext {
  // A next page goes to the source by id: two sources sharing one would mix their cursors.
  const duplicate = sources.find(
    (source, index) => sources.findIndex(each => each.id === source.id) !== index,
  );
  if (duplicate) throw new Error(`Two account data sources share the id "${duplicate.id}"`);
  return {
    ranked: [...sources],
    concurrency,
    limiters: new WeakMap(),
    stacks: new Map(sources.map((source, rank) => [source.id, [{ source, rank }]])),
    nextFirst: -1,
    nextLast: sources.length,
    coalescing: new Map(),
  };
}

const settled = <T>(promise: Promise<T>): Promise<Settled<T>> =>
  promise.then(
    value => ({ status: "fulfilled", value }),
    (reason: unknown) => ({ status: "rejected", reason }),
  );

export const rejected = <T>(reason: unknown): Promise<Settled<T>> =>
  Promise.resolve({ status: "rejected", reason });

function serves(source: AccountDataSource, kind: AccountDataKind): boolean {
  return source.read?.[kind] !== undefined || source.readBatch?.[kind] !== undefined;
}

/** The source's limiter, made on first use: its own concurrency, else the router's, at least 1. */
export function limiterOf(context: RouterContext, source: AccountDataSource): Limiter {
  let limiter = context.limiters.get(source);
  if (!limiter) {
    limiter = createLimiter(Math.max(1, source.concurrency ?? context.concurrency));
    context.limiters.set(source, limiter);
  }
  return limiter;
}

/** One call per target, each settling on its own. */
export function readEachTarget<K extends AccountDataKind>(
  run: Limiter,
  read: AccountDataReader<K>,
  targets: readonly AccountTarget[],
  query: AccountDataQuery<K> | undefined,
): Answers<AccountDataResult<K>> {
  return targets.map(target => settled(run(() => read(target, query))));
}

/** The answers of one batch call, or a throw when the source answered a different count. */
export function checkBatchAnswer<T>(
  sourceId: AccountDataSourceId,
  part: readonly AccountTarget[],
  answers: Settled<T>[],
): Settled<T>[] {
  if (answers.length !== part.length) {
    throw new Error(
      `Source "${sourceId}" answered ${answers.length} results for ${part.length} accounts`,
    );
  }
  return answers;
}

/** One call per chunk of `maxBatchSize`; a failed call fails its chunk, never retried account by account. */
export function readInChunks<K extends AccountDataKind>(
  run: Limiter,
  source: AccountDataSource,
  read: AccountDataBatchReader<K>,
  targets: readonly AccountTarget[],
  query: AccountDataQuery<K> | undefined,
): Answers<AccountDataResult<K>> {
  const parts = chunk(targets, Math.max(1, source.maxBatchSize ?? targets.length));
  return parts.flatMap(part => {
    const answered = run(() => read(part, query)).then(answers =>
      checkBatchAnswer(source.id, part, answers),
    );
    return part.map((_target, index) =>
      answered.then(
        answers => answers[index],
        (reason: unknown): Settled<AccountDataResult<K>> => ({ status: "rejected", reason }),
      ),
    );
  });
}

/** Reads the targets through the source's batch reader if it has one, else its single reader. */
export function readFromSource<K extends AccountDataKind>(
  context: RouterContext,
  source: AccountDataSource,
  kind: K,
  targets: readonly AccountTarget[],
  query: AccountDataQuery<K> | undefined,
): Answers<AccountDataResult<K>> {
  const run = limiterOf(context, source);
  const batch = source.readBatch?.[kind];
  if (batch) return readInChunks(run, source, batch, targets, query);
  const single = source.read?.[kind];
  if (single) return readEachTarget(run, single, targets, query);
  const reason = new Error(`Source "${source.id}" has no reader for ${kind}`);
  return targets.map(() => rejected(reason));
}

/** The latest registration of each id, by rank: what `pickSource` walks. */
function rerank(context: RouterContext): void {
  context.ranked = [...context.stacks.values()]
    .flatMap(stack => stack.slice(-1))
    .sort((a, b) => a.rank - b.rank)
    .map(({ source }) => source);
}

/** Ranks a source last, first, or in place of the one sharing its id; its remover, in any order, leaves the others' ranks as they were. */
export function addSource(
  context: RouterContext,
  source: AccountDataSource,
  { first = false }: AddAccountDataSourceOptions = {},
): () => void {
  const stack = context.stacks.get(source.id) ?? [];
  context.stacks.set(source.id, stack);
  const replaced = stack.at(-1);
  let rank: number;
  if (first) rank = context.nextFirst--;
  else rank = replaced?.rank ?? context.nextLast++;
  const registration: Registration = { source, rank };
  stack.push(registration);
  rerank(context);
  return () => {
    const position = stack.indexOf(registration);
    if (position === -1) return;
    stack.splice(position, 1);
    if (stack.length === 0 && context.stacks.get(source.id) === stack) {
      context.stacks.delete(source.id);
    }
    rerank(context);
  };
}

/** One target per account and cursor, a slot per read; a read whose descriptor throws fails alone. */
export function collectTargets(reads: readonly PendingRead[]): {
  slots: ReadSlot[];
  targets: Map<string, AccountTarget>;
} {
  const targets = new Map<string, AccountTarget>();
  const slots = reads.map(({ descriptor, cursor }): ReadSlot => {
    let accountUUID;
    try {
      accountUUID = computeAccountUUID(descriptor);
    } catch (failure) {
      return { failure };
    }
    const key = JSON.stringify([accountUUID, cursor ?? null]);
    if (!targets.has(key)) targets.set(key, { accountUUID, descriptor, cursor });
    return { key };
  });
  return { slots, targets };
}

const DEFAULT_PURPOSES: readonly AccountDescriptor["purpose"][] = ["account"];

/** The first ranked source with a reader for the kind that supports the account, among the pinned one if any. */
export function pickSource(
  context: RouterContext,
  kind: AccountDataKind,
  target: AccountTarget,
  sourceId: AccountDataSourceId | undefined,
  tried: ReadonlySet<AccountDataSource> = new Set(),
): AccountDataSource | undefined {
  return context.ranked.find(
    candidate =>
      !tried.has(candidate) &&
      (sourceId === undefined || candidate.id === sourceId) &&
      serves(candidate, kind) &&
      (candidate.purposes ?? DEFAULT_PURPOSES).includes(target.descriptor.purpose) &&
      candidate.supports(target.descriptor, kind),
  );
}

/** The targets each source reads, and the answers of those no source serves or whose `supports` threw. */
export function groupBySource<K extends AccountDataKind>(
  context: RouterContext,
  kind: K,
  targets: Map<string, AccountTarget>,
  sourceId: AccountDataSourceId | undefined,
): {
  groups: Map<AccountDataSource, Group[]>;
  answers: Map<string, Promise<Settled<AccountDataAnswer<K>>>>;
} {
  const groups = new Map<AccountDataSource, Group[]>();
  const answers = new Map<string, Promise<Settled<AccountDataAnswer<K>>>>();
  for (const [key, target] of targets) {
    let source;
    try {
      source = pickSource(context, kind, target, sourceId);
    } catch (error) {
      answers.set(key, rejected(error));
      continue;
    }
    if (!source) {
      answers.set(key, rejected(new NoAccountDataSourceError(target.accountUUID, kind, sourceId)));
      continue;
    }
    const group = groups.get(source);
    if (group) group.push({ key, target });
    else groups.set(source, [{ key, target }]);
  }
  return { groups, answers };
}

/** A source's answer, with the source that gave it. */
export function withSourceId<K extends AccountDataKind>(
  result: Promise<Settled<AccountDataResult<K>>>,
  sourceId: AccountDataSourceId,
): Promise<Settled<AccountDataAnswer<K>>> {
  return result.then(answer =>
    answer.status === "fulfilled"
      ? { status: "fulfilled", value: { data: answer.value, sourceId } }
      : answer,
  );
}

/** The answers back in read order: duplicates share their target's answer. */
export function answersInReadOrder<T>(
  slots: readonly ReadSlot[],
  answers: Map<string, Promise<Settled<T>>>,
): Answers<T> {
  return slots.map(slot => {
    if ("failure" in slot) return rejected(slot.failure);
    const answer = answers.get(slot.key);
    if (!answer) throw new Error(`No answer was recorded for ${slot.key}`);
    return answer;
  });
}

/** Routes the reads of one tick: each distinct target to its source, the answers back in read order. */
export function route<K extends AccountDataKind>(
  context: RouterContext,
  kind: K,
  reads: readonly PendingRead[],
  { query, sourceId }: AccountDataReadOptions<K>,
): Answers<AccountDataAnswer<K>> {
  const { slots, targets } = collectTargets(reads);
  const { groups, answers } = groupBySource(context, kind, targets, sourceId);
  for (const [source, group] of groups) {
    const results = readFromSource(
      context,
      source,
      kind,
      group.map(({ target }) => target),
      query,
    );
    results.forEach((result, index) => {
      const { key, target } = group[index];
      answers.set(key, orNextSource(context, kind, target, { query, sourceId }, source, result));
    });
  }
  return answersInReadOrder(slots, answers);
}

const isNotServed = (reason: unknown) =>
  reason instanceof Error && reason.name === "AccountDataNotServedError";

/** The source's answer, or the next ranked source's when it did not serve the account; never for a pinned source or a cursor. */
export function orNextSource<K extends AccountDataKind>(
  context: RouterContext,
  kind: K,
  target: AccountTarget,
  options: AccountDataReadOptions<K>,
  source: AccountDataSource,
  result: Promise<Settled<AccountDataResult<K>>>,
  tried: ReadonlySet<AccountDataSource> = new Set([source]),
): Promise<Settled<AccountDataAnswer<K>>> {
  return result.then(answer => {
    if (
      answer.status === "fulfilled" ||
      options.sourceId !== undefined ||
      target.cursor !== undefined ||
      !isNotServed(answer.reason)
    ) {
      return withSourceId(Promise.resolve(answer), source.id);
    }
    let next;
    try {
      next = pickSource(context, kind, target, undefined, tried);
    } catch (error) {
      return rejected<AccountDataAnswer<K>>(error);
    }
    if (!next) return { status: "rejected", reason: answer.reason };
    const [nextResult] = readFromSource(context, next, kind, [target], options.query);
    return orNextSource(
      context,
      kind,
      target,
      options,
      next,
      nextResult,
      new Set([...tried, next]),
    );
  });
}

/** Reads share a tick when they share the kind, the pinned source and the query, whatever its key order. */
export function coalescingKey<K extends AccountDataKind>(
  kind: K,
  { sourceId, query }: AccountDataReadOptions<K>,
): string {
  return [kind, sourceId ?? "", accountDataQueryKey(query)].join("\u0000");
}

/** The reads of this tick for these options, routed together once the tick ends. */
export function coalesce<K extends AccountDataKind>(
  context: RouterContext,
  kind: K,
  options: AccountDataReadOptions<K>,
): Coalesced<K> {
  const key = coalescingKey(kind, options);
  // The key holds the kind, so what is stored under it was built for this very `K`.
  const existing = context.coalescing.get(key) as Coalesced<K> | undefined;
  if (existing) return existing;
  const reads: PendingRead[] = [];
  const answers = Promise.resolve().then(() => {
    context.coalescing.delete(key);
    return route(context, kind, reads, options);
  });
  const created: Coalesced<K> = { reads, answers };
  context.coalescing.set(key, created);
  return created;
}
