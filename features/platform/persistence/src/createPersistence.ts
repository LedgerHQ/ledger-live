import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import type {
  CollectionRecordDefinition,
  RecordDefinition,
  ValueRecordDefinition,
} from "@shared/persistence";
import { StorageLockedError, type StoragePort } from "@shared/storage";
import type { PersistenceBinding } from "./bindings";
import {
  isWritableStatus,
  recordStatusChanged,
  recordsHydrationStarted,
  selectRecordStatus,
  type PersistenceRootState,
  type RecordStatus,
} from "./persistenceSlice";
import type { PersistenceFailure, ReportPersistenceFailure } from "./reportFailure";
import {
  assertBindingsFit,
  decodeStoredEntry,
  NotAListError,
  readEntries,
  storedSnapshot,
  writeEntries,
  type StoredEntry,
  type WrittenEntries,
} from "./internals/collections";
import { describeErrorWithoutValue } from "./internals/describeErrorWithoutValue";
import { createWriteScheduler, type WriteScheduler } from "./internals/strategies";

type Dispatch = (action: UnknownAction) => unknown;

/** A store that changes during each write must not keep a quit waiting for ever. */
const MAX_FLUSH_ROUNDS = 5;

type PersistenceInput<State> = {
  storage: StoragePort;
  bindings: ReadonlyArray<PersistenceBinding<State>>;
  report: ReportPersistenceFailure;
};

export type HydrationStatuses = Record<string, RecordStatus>;

export type HydrationStore<State> = { dispatch: Dispatch; getState: () => State };

export type Persistence<State> = {
  middleware: Middleware<object, State>;
  /** Reads the records (or only `keys`) and loads them into the store. */
  hydrate(
    store: HydrationStore<State>,
    options?: { keys?: ReadonlyArray<string> },
  ): Promise<HydrationStatuses>;
  /** Runs the scheduled writes now and waits for them. Rejects when 1 of them fails. */
  flush(): Promise<void>;
  /** Cancels the scheduled writes, waits for the write in progress, then blocks all writes. */
  stop(): Promise<void>;
  /** Unblocks the writes after `stop()` and writes what changed in the meantime. */
  resume(): void;
};

type Runtime<State> = {
  binding: PersistenceBinding<State>;
  scheduler: WriteScheduler;
  /** The reference of the last change, and the entries of the last collection write. */
  baseline: { selected: unknown; written?: WrittenEntries } | undefined;
  /** The stored entries that did not reach the state: they stay stored. */
  kept: StoredEntry[];
  /** The stored ids at the hydration. A state entry with another id is not stored yet. */
  storedIds: ReadonlySet<string>;
  writeQueued: boolean;
  /** The writes, 1 after the other. It never rejects: `stop` waits for it. */
  writeChain: Promise<void>;
  /** The last queued write, until it settles. It rejects when the write fails: `flush` waits for it. */
  lastWrite: Promise<void> | undefined;
};

class HydrationFailure extends Error {
  override name = "HydrationFailure";
  constructor(
    readonly operation: PersistenceFailure["operation"],
    readonly cause: unknown,
  ) {
    super(operation);
  }
}

async function attempt<T>(
  operation: PersistenceFailure["operation"],
  run: () => T | Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HydrationFailure) throw error;
    // A stored value that is not a list read fine: its shape is wrong.
    throw new HydrationFailure(error instanceof NotAListError ? "decode" : operation, error);
  }
}

export function createPersistence<State extends PersistenceRootState>({
  storage,
  bindings,
  report,
}: PersistenceInput<State>): Persistence<State> {
  assertBindingsFit(storage, bindings);
  let getState: (() => State) | undefined;
  let stopped = false;

  const reportFor = (
    record: RecordDefinition<State, UnknownAction>,
    operation: PersistenceFailure["operation"],
    error: unknown,
    entry?: number,
  ) =>
    report({
      key: record.key,
      version: record.version,
      operation,
      reason: describeErrorWithoutValue(error),
      ...(entry === undefined ? {} : { entry }),
    });

  const runtimes: Runtime<State>[] = bindings.map(binding => {
    const runtime: Runtime<State> = {
      binding,
      scheduler: createWriteScheduler(binding.strategy ?? "immediate", () => queueWrite(runtime)),
      baseline: undefined,
      kept: [],
      storedIds: new Set(),
      writeQueued: false,
      writeChain: Promise.resolve(),
      lastWrite: undefined,
    };
    return runtime;
  });

  // Hydration

  async function hydrateValue(
    record: ValueRecordDefinition<State, UnknownAction>,
    store: HydrationStore<State>,
  ) {
    const stored = await attempt("read", () => storage.get(record.key));
    if (stored === undefined || stored === null) return "empty";
    const slice = await attempt("decode", () => record.codec.decode(stored));
    await attempt("decode", () => store.dispatch(record.state.toHydrationAction(slice)));
    return "loaded";
  }

  /**
   * Each entry reads and decodes alone; an entry that fails is reported. Every stored entry that
   * does not reach the state (a failure, or an account that the app drops) stays stored.
   */
  async function hydrateCollection(
    runtime: Runtime<State>,
    record: CollectionRecordDefinition<State, UnknownAction>,
    store: HydrationStore<State>,
  ) {
    const stored = await attempt("read", () =>
      readEntries(storage, record, runtime.binding.keyScheme),
    );
    runtime.kept = [];
    runtime.storedIds = new Set(
      stored?.flatMap(entry => (entry.id === undefined ? [] : [entry.id])),
    );
    if (stored === undefined) return "empty";

    const results = await Promise.all(stored.map(entry => decodeStoredEntry(record, entry)));
    results.forEach((result, index) => {
      if ("failure" in result)
        reportFor(record, result.failure.operation, result.failure.error, index);
    });
    const decoded = results.flatMap(result => ("decoded" in result ? [result.decoded] : []));
    await attempt("decode", () =>
      record.state.toHydrationActions(decoded).forEach(action => store.dispatch(action)),
    );

    const loaded = new Set(record.state.select(store.getState()).map(record.entryId));
    // A migration can change the id of an entry: an entry reached the state with its decoded id.
    const reachedState = (result: (typeof results)[number]) =>
      "decoded" in result && loaded.has(record.codec.decodedId(result.decoded));
    runtime.kept = results
      .filter(result => !reachedState(result))
      .map(result => result.entry)
      .filter(entry => entry.id === undefined || !loaded.has(entry.id));
    return "loaded";
  }

  async function hydrateOne(
    runtime: Runtime<State>,
    store: HydrationStore<State>,
  ): Promise<RecordStatus> {
    const { record } = runtime.binding;
    try {
      return record.kind === "collection"
        ? await hydrateCollection(runtime, record, store)
        : await hydrateValue(record, store);
    } catch (error) {
      const failure =
        error instanceof HydrationFailure ? error : new HydrationFailure("read", error);
      if (failure.cause instanceof StorageLockedError) return "locked";
      reportFor(record, failure.operation, failure.cause);
      return "failed";
    }
  }

  // Writes

  async function runWrite(runtime: Runtime<State>) {
    runtime.writeQueued = false;
    const state = getState?.();
    const { record, keyScheme } = runtime.binding;
    const { baseline } = runtime;
    if (stopped || !state || !baseline) return;
    if (!isWritableStatus(selectRecordStatus(state, record.key))) return;
    if (record.kind !== "collection") {
      await storage.set(record.key, record.codec.encode(record.state.select(state)));
      return;
    }
    const previous = baseline.written ?? { ids: [], byId: new Map() };
    const result = await writeEntries(storage, record, keyScheme, state, previous, runtime.kept);
    if (!result) return;
    baseline.written = result.written;
    runtime.kept = result.kept;
  }

  function queueWrite(runtime: Runtime<State>) {
    if (stopped || runtime.writeQueued) return;
    runtime.writeQueued = true;
    const write = runtime.writeChain.then(() => runWrite(runtime));
    runtime.writeChain = write.catch(error => reportFor(runtime.binding.record, "write", error));
    runtime.lastWrite = write;
    const settled = () => {
      if (runtime.lastWrite === write) runtime.lastWrite = undefined;
    };
    write.then(settled, settled);
  }

  /**
   * Runs the scheduled writes and waits for them, also after 1 fails: a quit must not cut the
   * others short. A change during a write schedules a new one, so it drains again, `rounds` times
   * at most. Returns the first failure.
   */
  async function drainWrites(
    rounds: number,
    failure?: PromiseRejectedResult,
  ): Promise<PromiseRejectedResult | undefined> {
    if (rounds === 0) return failure;
    runtimes.forEach(runtime => runtime.scheduler.flush());
    const writes = runtimes.flatMap(runtime => (runtime.lastWrite ? [runtime.lastWrite] : []));
    if (writes.length === 0) return failure;
    const results = await Promise.allSettled(writes);
    const failed = results.find(result => result.status === "rejected");
    return drainWrites(rounds - 1, failure ?? failed);
  }

  const middleware: Middleware<object, State> = api => {
    getState = api.getState;
    return next => action => {
      const result = next(action);
      if (stopped) return result;
      const state = api.getState();
      for (const runtime of runtimes) {
        const { record } = runtime.binding;
        if (!isWritableStatus(selectRecordStatus(state, record.key))) {
          if (runtime.baseline) runtime.scheduler.cancel();
          runtime.baseline = undefined;
          continue;
        }
        const selected = record.state.select(state);
        if (!runtime.baseline) {
          // The first state after the hydration: what was just read is not written back.
          const written =
            record.kind === "collection"
              ? storedSnapshot(record, state, runtime.storedIds, runtime.kept)
              : undefined;
          runtime.baseline = { selected, written };
          continue;
        }
        if (selected === runtime.baseline.selected) continue;
        runtime.baseline.selected = selected;
        runtime.scheduler.schedule();
      }
      return result;
    };
  };

  return {
    middleware,

    async hydrate(store, { keys } = {}) {
      const selected = keys
        ? runtimes.filter(runtime => keys.includes(runtime.binding.record.key))
        : runtimes;
      store.dispatch(recordsHydrationStarted(selected.map(runtime => runtime.binding.record.key)));
      const statuses: HydrationStatuses = {};
      await Promise.all(
        selected.map(async runtime => {
          const { key } = runtime.binding.record;
          statuses[key] = await hydrateOne(runtime, store);
          store.dispatch(recordStatusChanged({ key, status: statuses[key] }));
        }),
      );
      return statuses;
    },

    async flush() {
      if (stopped) return;
      const failure = await drainWrites(MAX_FLUSH_ROUNDS);
      if (failure) throw failure.reason;
    },

    async stop() {
      stopped = true;
      runtimes.forEach(runtime => runtime.scheduler.cancel());
      await Promise.all(runtimes.map(runtime => runtime.writeChain));
    },

    resume() {
      stopped = false;
      runtimes.forEach(runtime => {
        if (runtime.baseline) runtime.scheduler.schedule();
      });
    },
  };
}
