import type { UnknownAction } from "@reduxjs/toolkit";
import { replaceAccountBalances } from "@domain/entity-account-balance";
import { SourceUnderDeliveryError, UnservableSlicesError } from "./errors";
import { createAccountDataSourceRegistry } from "./registry";
import { createAccountDataScheduler, type AccountDataScheduler } from "./scheduler";
import { accountIdFor, fakeSource, makeRef } from "./port.mock";
import type { AccountDataSource } from "./port";

const ref = makeRef();
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const setup = (sources: AccountDataSource[], now = () => 1_000) => {
  const dispatched: UnknownAction[] = [];
  const errors: unknown[] = [];
  const scheduler = createAccountDataScheduler({
    registry: createAccountDataSourceRegistry(sources),
    dispatch: action => dispatched.push(action),
    now,
    onError: error => errors.push(error),
  });
  return { scheduler, dispatched, errors };
};

const granular = (options: Partial<Parameters<typeof fakeSource>[0]> = {}) =>
  fakeSource({ id: "coin-module-api", priority: 10, capabilities: ["balance"], ...options });

describe("createAccountDataScheduler", () => {
  let scheduler: AccountDataScheduler | undefined;
  afterEach(() => scheduler?.dispose());

  it("dispatches the balance replacement a source emits", async () => {
    const setUp = setup([granular()]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(setUp.dispatched).toHaveLength(1);
    expect(setUp.dispatched[0].type).toBe(replaceAccountBalances.type);
  });

  it("records freshness and the writing source on success", async () => {
    const setUp = setup([granular()]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(scheduler.getStatus(ref.accountId, "balance")).toEqual({
      pending: false,
      error: undefined,
      lastFetchedAt: 1_000,
      sourceId: "coin-module-api",
    });
  });

  it("skips a slice that is still fresh", async () => {
    const onFetch = jest.fn();
    const setUp = setup([granular({ onFetch })]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "first" });
    await scheduler.fetch({ ref, slices: ["balance"], reason: "second", maxAge: 60_000 });
    expect(onFetch).toHaveBeenCalledTimes(1);
  });

  it("treats data already in the store as fresh, so a background sync is not repeated", async () => {
    // The case that matters: BridgeSync produced a balance two seconds ago and the mirror stamped it.
    // The scheduler has never fetched this slice, so without `observedAt` it would run a full sync.
    const onFetch = jest.fn();
    const local = createAccountDataScheduler({
      registry: createAccountDataSourceRegistry([granular({ onFetch })]),
      dispatch: () => {},
      now: () => 100_000,
      observedAt: () => 98_000,
    });
    await local.fetch({ ref, slices: ["balance"], reason: "test", maxAge: 30_000 });
    expect(onFetch).not.toHaveBeenCalled();
    local.dispose();
  });

  it("still fetches when the stored data is older than maxAge", async () => {
    const onFetch = jest.fn();
    const local = createAccountDataScheduler({
      registry: createAccountDataSourceRegistry([granular({ onFetch })]),
      dispatch: () => {},
      now: () => 100_000,
      observedAt: () => 10_000,
    });
    await local.fetch({ ref, slices: ["balance"], reason: "test", maxAge: 30_000 });
    expect(onFetch).toHaveBeenCalledTimes(1);
    local.dispose();
  });

  it("ignores stored data on a forced read", async () => {
    const onFetch = jest.fn();
    const local = createAccountDataScheduler({
      registry: createAccountDataSourceRegistry([granular({ onFetch })]),
      dispatch: () => {},
      now: () => 100_000,
      observedAt: () => 99_999,
    });
    await local.fetch({ ref, slices: ["balance"], reason: "refresh", maxAge: 0 });
    expect(onFetch).toHaveBeenCalledTimes(1);
    local.dispose();
  });

  it("refetches once the value is older than maxAge", async () => {
    const onFetch = jest.fn();
    let clock = 1_000;
    const setUp = setup([granular({ onFetch })], () => clock);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "first" });
    clock = 100_000;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "second", maxAge: 1_000 });
    expect(onFetch).toHaveBeenCalledTimes(2);
  });

  it("forces a round-trip on maxAge 0", async () => {
    const onFetch = jest.fn();
    const setUp = setup([granular({ onFetch })]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "first" });
    await scheduler.fetch({ ref, slices: ["balance"], reason: "refresh", maxAge: 0 });
    expect(onFetch).toHaveBeenCalledTimes(2);
  });

  it("coalesces concurrent demands for the same slice into one fetch", async () => {
    const onFetch = jest.fn();
    let open = () => {};
    const gate = new Promise<void>(resolve => (open = resolve));
    const setUp = setup([granular({ onFetch, gate })]);
    scheduler = setUp.scheduler;
    const first = scheduler.fetch({ ref, slices: ["balance"], reason: "a" });
    const second = scheduler.fetch({ ref, slices: ["balance"], reason: "b" });
    open();
    await Promise.all([first, second]);
    expect(onFetch).toHaveBeenCalledTimes(1);
    expect(setUp.dispatched).toHaveLength(1);
  });

  it("does not let a forced read join a run already in flight", async () => {
    const onFetch = jest.fn();
    let open = () => {};
    const gate = new Promise<void>(resolve => (open = resolve));
    const setUp = setup([granular({ onFetch, gate })]);
    scheduler = setUp.scheduler;
    const background = scheduler.fetch({ ref, slices: ["balance"], reason: "background" });
    const forced = scheduler.fetch({ ref, slices: ["balance"], reason: "refresh", maxAge: 0 });
    open();
    await Promise.all([background, forced]);
    expect(onFetch).toHaveBeenCalledTimes(2);
  });

  it("marks a slice pending while its fetch is in flight", async () => {
    let open = () => {};
    const gate = new Promise<void>(resolve => (open = resolve));
    const setUp = setup([granular({ gate })]);
    scheduler = setUp.scheduler;
    const running = scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    await flush();
    expect(scheduler.getStatus(ref.accountId, "balance").pending).toBe(true);
    open();
    await running;
    expect(scheduler.getStatus(ref.accountId, "balance").pending).toBe(false);
  });

  it("notifies status listeners", async () => {
    const setUp = setup([granular()]);
    scheduler = setUp.scheduler;
    const listener = jest.fn();
    scheduler.subscribeStatus(listener);
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(listener).toHaveBeenCalled();
  });

  it("records a source failure as a per-slice error and keeps no stale freshness", async () => {
    const boom = new Error("network down");
    const setUp = setup([granular({ fail: boom })]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    const status = scheduler.getStatus(ref.accountId, "balance");
    expect(status.error).toBe(boom);
    expect(status.pending).toBe(false);
    expect(status.lastFetchedAt).toBeUndefined();
    expect(setUp.errors).toEqual([boom]);
  });

  it("reports a source that claims a capability then emits nothing", async () => {
    const setUp = setup([granular({ updates: () => [] })]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(setUp.errors[0]).toBeInstanceOf(SourceUnderDeliveryError);
  });

  it("does not blame a source for a slice it was only the fallback for", async () => {
    const fallbackOnly = fakeSource({
      id: "legacy-bridge",
      priority: 0,
      capabilities: [],
      deliveries: ["balance", "resources"],
      updates: ref => [{ slice: "balance", accountId: ref.accountId, balances: [] }],
    });
    const setUp = setup([fallbackOnly]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance", "resources"], reason: "test" });
    expect(setUp.errors).toEqual([]);
    expect(scheduler.getStatus(ref.accountId, "resources").pending).toBe(false);
  });

  it("records an unservable slice as an error rather than throwing at the caller", async () => {
    const setUp = setup([granular()]);
    scheduler = setUp.scheduler;
    await expect(
      scheduler.fetch({ ref, slices: ["resources"], reason: "test" }),
    ).resolves.toBeUndefined();
    expect(scheduler.getStatus(ref.accountId, "resources").error).toBeInstanceOf(
      UnservableSlicesError,
    );
  });

  it("resolves without a fetch when no source is registered at all", async () => {
    const setUp = setup([]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(setUp.dispatched).toEqual([]);
    expect(setUp.errors[0]).toBeInstanceOf(UnservableSlicesError);
  });

  it("serves the slices it can when another slice is unservable", async () => {
    const setUp = setup([granular()]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance", "resources"], reason: "test" });
    expect(setUp.dispatched).toHaveLength(1);
    expect(scheduler.getStatus(ref.accountId, "balance").lastFetchedAt).toBe(1_000);
    expect(scheduler.getStatus(ref.accountId, "resources").error).toBeInstanceOf(
      UnservableSlicesError,
    );
  });

  it("clears the pending flag of a slice it claimed by over-delivery but did not emit", async () => {
    const overClaiming = fakeSource({
      id: "coin-module-api",
      priority: 10,
      capabilities: ["balance"],
      deliveries: ["balance", "operations"],
    });
    const setUp = setup([overClaiming]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(scheduler.getStatus(ref.accountId, "operations").pending).toBe(false);
  });

  it("does not fault a source for staying silent on a capability nobody requested", async () => {
    // `deliveries` is static, so a source that can serve two slices declares both even when only one
    // was asked for. Emitting just the requested one is correct, not an under-delivery.
    const twoSlices = fakeSource({
      id: "coin-module-api",
      priority: 10,
      capabilities: ["balance", "operations"],
    });
    const setUp = setup([twoSlices]);
    scheduler = setUp.scheduler;
    await scheduler.fetch({ ref, slices: ["balance"], reason: "test" });
    expect(setUp.errors).toEqual([]);
    expect(scheduler.getStatus(ref.accountId, "balance").lastFetchedAt).toBe(1_000);
    expect(scheduler.getStatus(ref.accountId, "operations").pending).toBe(false);
  });

  it("bounds the number of source runs in flight", async () => {
    let peak = 0;
    let live = 0;
    let started = 0;
    let open = () => {};
    const gate = new Promise<void>(resolve => (open = resolve));
    const counting: AccountDataSource = {
      id: "counting",
      priority: 10,
      supports: () => true,
      capabilities: () => new Set(["balance"]),
      deliveries: () => new Set(["balance"]),
      async *fetch({ ref }) {
        started++;
        live++;
        peak = Math.max(peak, live);
        await gate;
        live--;
        yield { slice: "balance", accountId: ref.accountId, balances: [] };
      },
    };
    const local = createAccountDataScheduler({
      registry: createAccountDataSourceRegistry([counting]),
      dispatch: () => {},
      maxConcurrent: 2,
    });
    const pending = ["0xa", "0xb", "0xc", "0xd", "0xe", "0xf"].map(address =>
      local.fetch({
        ref: makeRef({ accountId: accountIdFor(address), address }),
        slices: ["balance"],
        reason: "test",
      }),
    );
    await flush();
    expect(peak).toBe(2);
    open();
    await Promise.all(pending);
    expect(started).toBe(6);
    local.dispose();
  });

  describe("subscribe", () => {
    it("fetches immediately and reference-counts demand", async () => {
      const onFetch = jest.fn();
      const setUp = setup([granular({ onFetch })]);
      scheduler = setUp.scheduler;
      const releaseA = scheduler.subscribe(ref, ["balance"]);
      const releaseB = scheduler.subscribe(ref, ["balance"]);
      await flush();
      expect(scheduler.demandCount(ref.accountId, "balance")).toBe(2);
      releaseA();
      expect(scheduler.demandCount(ref.accountId, "balance")).toBe(1);
      releaseB();
      expect(scheduler.demandCount(ref.accountId, "balance")).toBe(0);
      expect(onFetch).toHaveBeenCalledTimes(1);
    });

    it("is idempotent when released twice", async () => {
      const setUp = setup([granular()]);
      scheduler = setUp.scheduler;
      const release = scheduler.subscribe(ref, ["balance"]);
      await flush();
      release();
      release();
      expect(scheduler.demandCount(ref.accountId, "balance")).toBe(0);
    });

    it("clears every poll once each subscription has released, whatever its cadence", () => {
      jest.useFakeTimers();
      try {
        const local = createAccountDataScheduler({
          registry: createAccountDataSourceRegistry([granular()]),
          dispatch: () => {},
        });
        // Different cadences own different intervals, so releasing one must not be judged on the
        // other's demand still being non-zero.
        const releaseSlow = local.subscribe(ref, ["balance"], { pollMs: 1_000 });
        const releaseFast = local.subscribe(ref, ["balance"], { pollMs: 50 });
        expect(jest.getTimerCount()).toBe(2);
        releaseSlow();
        releaseFast();
        expect(jest.getTimerCount()).toBe(0);
        local.dispose();
      } finally {
        jest.useRealTimers();
      }
    });

    it("keeps one interval for two subscriptions sharing a cadence", () => {
      jest.useFakeTimers();
      try {
        const local = createAccountDataScheduler({
          registry: createAccountDataSourceRegistry([granular()]),
          dispatch: () => {},
        });
        const releaseA = local.subscribe(ref, ["balance"], { pollMs: 100 });
        const releaseB = local.subscribe(ref, ["balance"], { pollMs: 100 });
        expect(jest.getTimerCount()).toBe(1);
        releaseA();
        expect(jest.getTimerCount()).toBe(1);
        releaseB();
        expect(jest.getTimerCount()).toBe(0);
        local.dispose();
      } finally {
        jest.useRealTimers();
      }
    });

    it("polls while subscribed and stops on release", async () => {
      const onFetch = jest.fn();
      const local = createAccountDataScheduler({
        registry: createAccountDataSourceRegistry([granular({ onFetch })]),
        dispatch: () => {},
      });
      // Real timers: the poll has to survive the microtask hop between `subscribe` and the source's
      // first emission, which advancing fake timers does not flush.
      const release = local.subscribe(ref, ["balance"], { pollMs: 10, maxAge: 0 });
      await new Promise(resolve => setTimeout(resolve, 45));
      const whileSubscribed = onFetch.mock.calls.length;
      expect(whileSubscribed).toBeGreaterThan(1);
      release();
      await new Promise(resolve => setTimeout(resolve, 40));
      expect(onFetch).toHaveBeenCalledTimes(whileSubscribed);
      local.dispose();
    });
  });
});
