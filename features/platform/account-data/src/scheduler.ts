import type { UnknownAction } from "@reduxjs/toolkit";
import { replaceAccountBalances } from "@domain/entity-account-balance";
import type { AccountId } from "@shared/schema-primitives";
import { SourceUnderDeliveryError, UnservableSlicesError } from "./errors";
import { sliceSetKey } from "./internals";
import { planFetch, type FetchPlan } from "./router";
import type { AccountDataSourceRegistry } from "./registry";
import {
  IDLE_SLICE_STATUS,
  type AccountDataSource,
  type AccountRef,
  type AccountSlice,
  type SliceStatus,
  type SliceUpdate,
} from "./port";

/** Default freshness window: a balance younger than this is not worth a round-trip. */
export const DEFAULT_MAX_AGE = 30_000;

/** Default parallel source runs, mirroring `SYNC_MAX_CONCURRENT`. */
export const DEFAULT_MAX_CONCURRENT = 4;

export type FetchInput = {
  ref: AccountRef;
  slices: readonly AccountSlice[];
  reason: string;
  /** Max acceptable age in ms. `0` forces a round-trip. Defaults to `DEFAULT_MAX_AGE`. */
  maxAge?: number;
  signal?: AbortSignal;
};

export type SubscribeOptions = {
  maxAge?: number;
  /** Re-fetch every `pollMs` while at least one caller is subscribed. Omitted means fetch once. */
  pollMs?: number;
  reason?: string;
};

export type AccountDataScheduler = {
  /**
   * Fetch `slices` for `ref`, skipping whatever is already fresh enough and joining whatever is
   * already in flight. Resolves once every requested slice has settled.
   */
  fetch(input: FetchInput): Promise<void>;
  /**
   * Register reference-counted demand: the slices are fetched now, and kept fresh while at least
   * one caller is subscribed. Returns the release function.
   */
  subscribe(
    ref: AccountRef,
    slices: readonly AccountSlice[],
    options?: SubscribeOptions,
  ): () => void;
  /** Current status of one `(account, slice)` pair. Stable reference while nothing changes. */
  getStatus(accountId: AccountId, slice: AccountSlice): SliceStatus;
  /** Notified whenever any status changes — the `useSyncExternalStore` subscribe half. */
  subscribeStatus(listener: () => void): () => void;
  /** Number of callers currently demanding this pair. Exposed for diagnostics and tests. */
  demandCount(accountId: AccountId, slice: AccountSlice): number;
  /** Cancel every poll and drop every listener. */
  dispose(): void;
};

export type AccountDataSchedulerOptions = {
  registry: AccountDataSourceRegistry;
  dispatch: (action: UnknownAction) => void;
  defaultMaxAge?: number;
  maxConcurrent?: number;
  now?: () => number;
  /**
   * When the data already in the store for this pair was observed, if anything is there.
   *
   * Freshness is a property of the data, not of who fetched it. `at` on a balance row is stamped by
   * whoever produced it — a source, *or* the legacy mirror following `BridgeSync`. Without this the
   * first `useAccountBalance` after a background sync would refetch a balance that is seconds old,
   * and on a family with no granular module that means a **second full sync**.
   *
   * See `observedBalanceAt` for the standard implementation over the balance table.
   */
  observedAt?: (accountId: AccountId, slice: AccountSlice) => number | undefined;
  /** Called for every slice-scoped failure, for logging / analytics. */
  onError?: (
    error: unknown,
    context: { ref: AccountRef; slice: AccountSlice; reason: string },
  ) => void;
};

const keyOf = (accountId: AccountId, slice: AccountSlice) => `${accountId}|${slice}`;

/**
 * Turns demand into the fewest possible network calls.
 *
 * The four things it does that a per-account sync queue cannot:
 * - **freshness per slice** — a balance fetched 2s ago is skipped even though the account's
 *   operations are hours old;
 * - **coalescing per `(account, slice)`** — forty portfolio rows mounting at once produce one fetch
 *   per account, and a second caller joins the in-flight promise instead of starting another;
 * - **routing per slice** — the plan comes from `planFetch`, so the cheapest source that can serve
 *   a slice serves it and a full sync is only paid for when something needs it;
 * - **reference-counted demand** — polling exists only while something is on screen asking for it.
 */
export function createAccountDataScheduler({
  registry,
  dispatch,
  defaultMaxAge = DEFAULT_MAX_AGE,
  maxConcurrent = DEFAULT_MAX_CONCURRENT,
  now = () => Date.now(),
  observedAt,
  onError,
}: AccountDataSchedulerOptions): AccountDataScheduler {
  const statuses = new Map<string, SliceStatus>();
  const inflight = new Map<string, Promise<void>>();
  const demand = new Map<string, number>();
  const polls = new Map<string, { refs: number; handle: ReturnType<typeof setInterval> }>();
  const listeners = new Set<() => void>();
  let running = 0;
  const waiting: (() => void)[] = [];

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const getStatus = (accountId: AccountId, slice: AccountSlice): SliceStatus =>
    statuses.get(keyOf(accountId, slice)) ?? IDLE_SLICE_STATUS;

  const patchStatus = (
    accountId: AccountId,
    slice: AccountSlice,
    patch: Partial<SliceStatus>,
  ): void => {
    const key = keyOf(accountId, slice);
    statuses.set(key, { ...getStatus(accountId, slice), ...patch });
  };

  const acquire = async (): Promise<void> => {
    if (running < maxConcurrent) {
      running++;
      return;
    }
    // No `running++` on this path: `release` hands its slot straight over rather than freeing it,
    // so a synchronous `acquire` cannot slip into the gap between the decrement and the wake-up.
    await new Promise<void>(resolve => waiting.push(resolve));
  };

  const release = (): void => {
    const next = waiting.shift();
    if (next) next();
    else running--;
  };

  const isFresh = (accountId: AccountId, slice: AccountSlice, maxAge: number): boolean => {
    if (maxAge <= 0) return false;
    // The later of "when this scheduler last fetched it" and "when the data in the store was
    // observed". The second is what stops a redundant fetch — and, on a legacy family, a redundant
    // full sync — right after a background sync has already produced the value.
    const fetched = getStatus(accountId, slice).lastFetchedAt;
    const observed = observedAt?.(accountId, slice);
    const seen = Math.max(fetched ?? -Infinity, observed ?? -Infinity);
    return Number.isFinite(seen) && now() - seen < maxAge;
  };

  const applyUpdate = (update: SliceUpdate): void => {
    dispatch(replaceAccountBalances({ accountId: update.accountId, balances: update.balances }));
  };

  const runLeg = async (
    input: FetchInput,
    source: AccountDataSource,
    slices: AccountSlice[],
    tracked: ReadonlySet<AccountSlice>,
  ): Promise<void> => {
    const { ref, reason, signal } = input;
    // `tracked` — not `slices` — because the caller marked every slice this leg *claims* as pending.
    // Anything it claimed and did not emit has to be cleared here or its shimmer never stops.
    const undelivered = new Set(tracked);
    await acquire();
    try {
      for await (const update of source.fetch({ ref, slices, reason, signal })) {
        applyUpdate(update);
        undelivered.delete(update.slice);
        patchStatus(ref.accountId, update.slice, {
          pending: false,
          error: undefined,
          lastFetchedAt: now(),
          sourceId: source.id,
        });
        notify();
      }
      // Under-delivery is only a violation for a slice that was actually *requested* and that the
      // source claims as a capability. A `deliveries` set is static, so a granular source declaring
      // {balance, operations} and asked only for `balance` legitimately stays silent on the other —
      // filtering on `undelivered` alone would turn that into a spurious error.
      const requested = new Set(slices);
      const broken = [...undelivered].filter(
        slice => requested.has(slice) && source.capabilities(ref).has(slice),
      );
      if (broken.length > 0) {
        throw new SourceUnderDeliveryError(source.id, ref.accountId, broken);
      }
    } catch (error) {
      for (const slice of undelivered) {
        patchStatus(ref.accountId, slice, {
          pending: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        onError?.(error, { ref, slice, reason });
      }
      notify();
    } finally {
      release();
      // Slices the source was only ever the fallback for, and chose not to emit: clear their
      // pending flag so a shimmer does not spin forever waiting for data nobody promised.
      let cleared = false;
      for (const slice of undelivered) {
        if (getStatus(ref.accountId, slice).pending) {
          patchStatus(ref.accountId, slice, { pending: false });
          cleared = true;
        }
      }
      if (cleared) notify();
    }
  };

  const fetch = async (input: FetchInput): Promise<void> => {
    const { ref, slices, maxAge = defaultMaxAge } = input;
    const joined: Promise<void>[] = [];
    const needed: AccountSlice[] = [];

    for (const slice of slices) {
      const pending = inflight.get(keyOf(ref.accountId, slice));
      // `maxAge: 0` means "read it now". Joining a run already in flight would serve a value fetched
      // under whatever policy started it, so a forced read starts its own — the caller asked for a
      // round-trip and gets one, at the cost of a possible duplicate request.
      if (pending && maxAge > 0) {
        joined.push(pending);
        continue;
      }
      if (!isFresh(ref.accountId, slice, maxAge)) needed.push(slice);
    }

    if (needed.length === 0) {
      await Promise.all(joined);
      return;
    }

    // Errors are per slice, so an unservable one is recorded and dropped rather than taking the rest
    // of the request with it. `UnservableSlicesError` names exactly what could not be covered, so
    // re-planning without those slices always succeeds — one retry, never a loop.
    let plan: FetchPlan;
    try {
      plan = planFetch(ref, new Set(needed), registry.list());
    } catch (error) {
      if (!(error instanceof UnservableSlicesError)) throw error;
      const unservable = new Set<AccountSlice>(error.slices);
      for (const slice of unservable) {
        patchStatus(ref.accountId, slice, { pending: false, error });
        onError?.(error, { ref, slice, reason: input.reason });
      }
      notify();
      const servable = needed.filter(slice => !unservable.has(slice));
      if (servable.length === 0) {
        await Promise.all(joined);
        return;
      }
      plan = planFetch(ref, new Set(servable), registry.list());
    }

    const legs = plan.map(leg => {
      // Registered against everything the leg will emit, not only what it was picked for, so a
      // concurrent request for an over-delivered slice joins this run instead of starting its own.
      const claimed = new Set([...leg.slices, ...leg.source.deliveries(ref)]);
      const promise = runLeg(input, leg.source, leg.slices, claimed);
      for (const slice of claimed) {
        inflight.set(keyOf(ref.accountId, slice), promise);
        patchStatus(ref.accountId, slice, { pending: true, error: undefined });
      }
      void promise.finally(() => {
        for (const slice of claimed) {
          if (inflight.get(keyOf(ref.accountId, slice)) === promise) {
            inflight.delete(keyOf(ref.accountId, slice));
          }
        }
      });
      return promise;
    });

    notify();
    await Promise.all([...joined, ...legs]);
  };

  // `fetch` rejects for anything a source's `supports` / `capabilities` / `deliveries` throws, which
  // is not an `UnservableSlicesError` and so is not already routed per slice. Without this those
  // become unhandled rejections instead of the per-slice errors the rest of this file guarantees.
  const report = (running: Promise<void>, ref: AccountRef, slices: readonly AccountSlice[]) =>
    running.catch(error => {
      for (const slice of slices) {
        patchStatus(ref.accountId, slice, {
          pending: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
        onError?.(error, { ref, slice, reason: "subscribe" });
      }
      notify();
    });

  const subscribe = (
    ref: AccountRef,
    slices: readonly AccountSlice[],
    options: SubscribeOptions = {},
  ): (() => void) => {
    const { maxAge, pollMs, reason = "subscribe" } = options;
    for (const slice of slices) {
      const key = keyOf(ref.accountId, slice);
      demand.set(key, (demand.get(key) ?? 0) + 1);
    }
    void report(fetch({ ref, slices, reason, maxAge }), ref, slices);

    // One interval per (account, slices, cadence) group, reference-counted on its own key. Counting
    // it against the slices' aggregate demand instead would leak: two subscriptions over the same
    // slices with different cadences own different intervals, and neither release would see the
    // demand reach zero while the other is still mounted.
    const pollKey = `${ref.accountId}|${sliceSetKey(slices)}|${pollMs}`;
    if (pollMs !== undefined) {
      const existing = polls.get(pollKey);
      if (existing) {
        existing.refs++;
      } else {
        polls.set(pollKey, {
          refs: 1,
          handle: setInterval(() => {
            void report(
              fetch({ ref, slices, reason: `${reason}-poll`, maxAge: maxAge ?? pollMs }),
              ref,
              slices,
            );
          }, pollMs),
        });
      }
    }

    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const slice of slices) {
        const key = keyOf(ref.accountId, slice);
        const next = (demand.get(key) ?? 1) - 1;
        if (next > 0) demand.set(key, next);
        else demand.delete(key);
      }
      const poll = polls.get(pollKey);
      if (poll && --poll.refs <= 0) {
        clearInterval(poll.handle);
        polls.delete(pollKey);
      }
    };
  };

  const disposePolls = () => {
    for (const poll of polls.values()) clearInterval(poll.handle);
    polls.clear();
  };

  return {
    fetch,
    subscribe,
    getStatus,
    subscribeStatus: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    demandCount: (accountId, slice) => demand.get(keyOf(accountId, slice)) ?? 0,
    dispose: () => {
      disposePolls();
      listeners.clear();
      demand.clear();
    },
  };
}
