import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { fetchAccountData, fetchAccountDataBatch } from "./fetchAccountData";
import type { AccountDataSource, AccountTarget } from "./source";
import {
  accountUUID,
  counterBinding,
  descriptor,
  descriptorOf,
  feedBinding,
  indexOf,
  makeStore,
  type FeedPage,
  type FeedQuery,
} from "./testing";

const uuidOf = (index: number) => computeAccountUUID(descriptorOf(index));

const page = (items: string[], nextCursor?: string): FeedPage => ({
  items,
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

const counterSource = (counter: (target: AccountTarget) => Promise<number>): AccountDataSource => ({
  id: "s",
  supports: () => true,
  read: { counter },
});

const feedSource = (
  feed: (target: AccountTarget, query: FeedQuery | undefined) => Promise<FeedPage>,
  id = "s",
  supports: AccountDataSource["supports"] = () => true,
): AccountDataSource => ({ id, supports, read: { feed } });

function batchSource(
  answer: (target: AccountTarget) => PromiseSettledResult<number> = target => ({
    status: "fulfilled",
    value: indexOf(target),
  }),
) {
  const calls: AccountDescriptor[][] = [];
  const source: AccountDataSource = {
    id: "batch",
    supports: () => true,
    readBatch: {
      counter: async targets => {
        calls.push(targets.map(target => target.descriptor));
        return targets.map(answer);
      },
    },
  };
  return { source, calls };
}

describe("fetchAccountData", () => {
  describe("a head read", () => {
    it("stores what the source answered, and which source it was", async () => {
      const store = makeStore([counterSource(async () => 7)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.byAccount[accountUUID]?.value).toBe(7);
      expect(store.getState().counter.status[accountUUID]).toEqual({
        pending: false,
        sourceId: "s",
      });
    });

    it("stores the error when no source can answer", async () => {
      const store = makeStore([{ id: "nothing", supports: () => false }]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.status[accountUUID]?.error).toMatch(
        /No account data source serves counter/,
      );
    });

    it("stores the error when the app did not inject the router", async () => {
      const store = makeStore([], {});
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.status[accountUUID]?.error).toMatch(/No account data router/);
    });

    it("skips a read younger than maxAge, and reads with maxAge 0", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(counter).toHaveBeenCalledTimes(1);
      await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 0 }));
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("reads again once maxAge has passed", async () => {
      jest.useFakeTimers({ now: 0, doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] });
      try {
        const counter = jest.fn(async () => 1);
        const store = makeStore([counterSource(counter)]);
        await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 1000 }));
        jest.setSystemTime(999);
        await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 1000 }));
        expect(counter).toHaveBeenCalledTimes(1);
        jest.setSystemTime(1000);
        await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 1000 }));
        expect(counter).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it("treats a stamp from the future as stale", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      const ahead = { ...counterBinding, selectAt: () => Date.now() + 3_600_000 };
      await store.dispatch(fetchAccountData(ahead, descriptor));
      await store.dispatch(fetchAccountData(ahead, descriptor));
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("resolves a joined dispatch only once the read it joined is stored", async () => {
      const gate = deferred<number>();
      const store = makeStore([counterSource(() => gate.promise)]);
      const first = store.dispatch(fetchAccountData(counterBinding, descriptor));
      let joinedDone = false;
      const joined = store
        .dispatch(fetchAccountData(counterBinding, descriptor))
        .then(() => (joinedDone = true));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(joinedDone).toBe(false);
      gate.resolve(5);
      await Promise.all([first, joined]);
      expect(store.getState().counter.byAccount[accountUUID]?.value).toBe(5);
    });

    it("keeps a joined dispatch waiting through the newer read that replaced the one it joined", async () => {
      const gates = [deferred<number>(), deferred<number>()];
      const counter = jest
        .fn()
        .mockReturnValueOnce(gates[0].promise)
        .mockReturnValueOnce(gates[1].promise);
      const store = makeStore([counterSource(counter)]);
      const first = store.dispatch(fetchAccountData(counterBinding, descriptor));
      let joinedDone = false;
      const joined = store
        .dispatch(fetchAccountData(counterBinding, descriptor))
        .then(() => (joinedDone = true));
      await new Promise(resolve => setTimeout(resolve, 0));
      const newer = store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 0 }));
      gates[0].resolve(1);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(joinedDone).toBe(false);
      gates[1].resolve(2);
      await Promise.all([first, joined, newer]);
      expect(store.getState().counter.byAccount[accountUUID]?.value).toBe(2);
    });

    it("reads once again data restored from an earlier session, however fresh", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      const restored = { ...counterBinding, selectAt: () => Date.now() };
      await store.dispatch(fetchAccountData(restored, descriptor));
      expect(counter).toHaveBeenCalledTimes(1);
    });

    it("reads a query again after it failed, even when another query's data is fresh", async () => {
      const feed = jest
        .fn<Promise<FeedPage>, [AccountTarget, FeedQuery | undefined]>()
        .mockResolvedValueOnce(page(["a"]))
        .mockRejectedValueOnce(new Error("down"))
        .mockResolvedValueOnce(page(["b"]));
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      expect(feed).toHaveBeenCalledTimes(3);
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["b"]);
    });

    it("joins a read already in flight for the same account", async () => {
      const gate = deferred<number>();
      const counter = jest.fn(() => gate.promise);
      const store = makeStore([counterSource(counter)]);
      const first = store.dispatch(fetchAccountData(counterBinding, descriptor));
      const second = store.dispatch(fetchAccountData(counterBinding, descriptor));
      gate.resolve(1);
      await Promise.all([first, second]);
      expect(counter).toHaveBeenCalledTimes(1);
    });

    it("reads again with maxAge 0 while a read is in flight, and keeps only the newer answer", async () => {
      const gate = deferred<number>();
      const counter = jest.fn().mockReturnValueOnce(gate.promise).mockResolvedValueOnce(2);
      const store = makeStore([counterSource(counter)]);
      const first = store.dispatch(fetchAccountData(counterBinding, descriptor));
      await new Promise(resolve => setTimeout(resolve, 0));
      await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 0 }));
      gate.resolve(1);
      await first;
      expect(counter).toHaveBeenCalledTimes(2);
      expect(store.getState().counter.byAccount[accountUUID]?.value).toBe(2);
    });

    it("does not trust a pending flag left without a read in flight", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      const stuck = { ...counterBinding, selectPending: () => true };
      await store.dispatch(fetchAccountData(stuck, descriptor));
      expect(counter).toHaveBeenCalledTimes(1);
    });

    it("reads a new query while the previous one is in flight, and drops the stale answer", async () => {
      const first = deferred<FeedPage>();
      const feed = jest.fn((_target: AccountTarget, query?: FeedQuery) =>
        query?.limit === 1 ? first.promise : Promise.resolve(page(["new"])),
      );
      const store = makeStore([feedSource(feed)]);
      const old = store.dispatch(
        fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }),
      );
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      first.resolve(page(["old"]));
      await old;
      expect(feed).toHaveBeenCalledTimes(2);
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["new"]);
    });

    it("reads a new query even when the stored data is fresh", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      expect(feed).toHaveBeenCalledTimes(2);
    });

    it("keeps two kinds of one account independent", async () => {
      const store = makeStore([
        {
          id: "s",
          supports: () => true,
          read: { counter: async () => 1, feed: async () => page(["a"]) },
        },
      ]);
      await Promise.all([
        store.dispatch(fetchAccountData(counterBinding, descriptor)),
        store.dispatch(fetchAccountData(feedBinding, descriptor)),
      ]);
      expect(store.getState().counter.byAccount[accountUUID]?.value).toBe(1);
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["a"]);
    });
  });

  describe("a next page", () => {
    it("reads from the stored cursor, keeps the query and appends the page", async () => {
      const feed = jest.fn(async (_target: AccountTarget, query?: FeedQuery) =>
        query?.cursor === "c1" ? page(["b"]) : page(["a"], "c1"),
      );
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(
        fetchAccountData(feedBinding, descriptor, { query: { limit: 1 }, more: true }),
      );
      expect(feed).toHaveBeenLastCalledWith(
        { accountUUID, descriptor },
        { limit: 1, cursor: "c1" },
        undefined,
      );
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["a", "b"]);
    });

    it("does not page a query whose head failed on top of another query's data", async () => {
      const feed = jest
        .fn<Promise<FeedPage>, [AccountTarget, FeedQuery | undefined]>()
        .mockResolvedValueOnce(page(["a"], "c1"))
        .mockRejectedValueOnce(new Error("down"));
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      await store.dispatch(
        fetchAccountData(feedBinding, descriptor, { query: { limit: 2 }, more: true }),
      );
      expect(feed).toHaveBeenCalledTimes(2);
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["a"]);
    });

    it("does not page data restored from an earlier session before a head read", async () => {
      const feed = jest.fn(async () => page(["b"]));
      const store = makeStore([feedSource(feed)]);
      const restored = {
        ...feedBinding,
        selectSourceId: () => "s",
        selectNextQuery: () => ({ cursor: "restored" }),
      };
      await store.dispatch(fetchAccountData(restored, descriptor, { more: true }));
      expect(feed).not.toHaveBeenCalled();
    });

    it("loads the next page asked for by what reacts to the head being stored", async () => {
      const feed = jest.fn(async (_target: AccountTarget, query?: FeedQuery) =>
        query?.cursor === "c1" ? page(["b"]) : page(["a"], "c1"),
      );
      const store = makeStore([feedSource(feed)]);
      let paged: Promise<void> | undefined;
      store.subscribe(() => {
        if (paged || !store.getState().feed.byAccount[accountUUID]) return;
        paged = store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      });
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      await paged;
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["a", "b"]);
    });

    it("neither trusts nor pages a query whose answer failed to be stored over another's", async () => {
      const feed = jest.fn(async (_target: AccountTarget, query?: FeedQuery) =>
        page([`limit${query?.limit}`], "c1"),
      );
      const store = makeStore([feedSource(feed)]);
      const breaking = {
        ...feedBinding,
        received: (payload: Parameters<typeof feedBinding.received>[0]) => {
          if (payload.data.items[0] === "limit2") throw new Error("reducer broke");
          return feedBinding.received(payload);
        },
      };
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(breaking, descriptor, { query: { limit: 2 } }));
      await store.dispatch(
        fetchAccountData(feedBinding, descriptor, { query: { limit: 2 }, more: true }),
      );
      expect(feed).toHaveBeenCalledTimes(2);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 2 } }));
      expect(feed).toHaveBeenCalledTimes(3);
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["limit2"]);
    });

    it("does nothing at the end of the pages", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(feed).toHaveBeenCalledTimes(1);
    });

    it("does nothing on a kind that is not paginated", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor, { more: true }));
      expect(counter).not.toHaveBeenCalled();
    });

    it("is not skipped by freshness", async () => {
      const feed = jest.fn(async (_target: AccountTarget, query?: FeedQuery) =>
        query?.cursor ? page([query.cursor], `${query.cursor}x`) : page(["a"], "c"),
      );
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(feed).toHaveBeenCalledTimes(3);
    });

    it("drops a next page answering after a newer head read started", async () => {
      const second = deferred<FeedPage>();
      const feed = jest.fn((_target: AccountTarget, query?: FeedQuery) =>
        query?.cursor ? second.promise : Promise.resolve(page(["head"], "c1")),
      );
      const store = makeStore([feedSource(feed)]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      const more = store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { maxAge: 0 }));
      second.resolve(page(["stale page"]));
      await more;
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["head"]);
    });

    it("does nothing without a source to pin the next page to", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([feedSource(feed)]);
      const unpinned = { ...feedBinding, selectNextQuery: () => ({ cursor: "c" }) };
      await store.dispatch(fetchAccountData(unpinned, descriptor, { more: true }));
      expect(feed).not.toHaveBeenCalled();
    });

    it("asks only the source that answered the head", async () => {
      let preferredOn = false;
      const preferred = jest.fn(async () => page(["preferred"]));
      const store = makeStore([
        feedSource(preferred, "preferred", () => preferredOn),
        feedSource(async (_target, query) =>
          query?.cursor ? page(["b"]) : page(["a"], "paged-cursor"),
        ),
      ]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      preferredOn = true;
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(preferred).not.toHaveBeenCalled();
      expect(store.getState().feed.byAccount[accountUUID]?.value.items).toEqual(["a", "b"]);
    });
  });
});

describe("fetchAccountDataBatch", () => {
  it("stores every answer from one source call", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(
      fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1), descriptorOf(2)]),
    );
    expect(calls).toHaveLength(1);
    const { byAccount, status } = store.getState().counter;
    expect([0, 1, 2].map(index => byAccount[uuidOf(index)]?.value)).toEqual([0, 1, 2]);
    expect(status[uuidOf(1)]).toEqual({ pending: false, sourceId: "batch" });
  });

  it("stores each failure on its own account", async () => {
    const { source } = batchSource(target =>
      indexOf(target) === 1
        ? { status: "rejected", reason: new Error("unknown address") }
        : { status: "fulfilled", value: indexOf(target) },
    );
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]));
    const { byAccount, status } = store.getState().counter;
    expect(byAccount[uuidOf(0)]?.value).toBe(0);
    expect(status[uuidOf(1)]?.error).toBe("unknown address");
  });

  it("reads only the accounts that are not fresh, and nothing when all are", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0)]));
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]));
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]));
    expect(calls).toEqual([[descriptorOf(0)], [descriptorOf(1)]]);
  });

  it("reads an account listed twice once", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(0)]));
    expect(calls).toEqual([[descriptorOf(0)]]);
  });

  it("waits for the reads it joined before resolving", async () => {
    const gate = deferred<number>();
    const store = makeStore([counterSource(() => gate.promise)]);
    const single = store.dispatch(fetchAccountData(counterBinding, descriptorOf(0)));
    let batchDone = false;
    const batch = store
      .dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0)]))
      .then(() => (batchDone = true));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(batchDone).toBe(false);
    gate.resolve(3);
    await Promise.all([single, batch]);
    expect(store.getState().counter.byAccount[uuidOf(0)]?.value).toBe(3);
  });

  it("is joined by a single read of an account it is already reading", async () => {
    const gate = deferred<void>();
    const counter = jest.fn(async (target: AccountTarget) => {
      await gate.promise;
      return indexOf(target);
    });
    const store = makeStore([counterSource(counter)]);
    const batch = store.dispatch(
      fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]),
    );
    const single = store.dispatch(fetchAccountData(counterBinding, descriptorOf(1)));
    gate.resolve();
    await Promise.all([batch, single]);
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("stores each account as soon as its own read answers", async () => {
    const gate = deferred<number>();
    const store = makeStore([
      counterSource(async target => (indexOf(target) === 1 ? gate.promise : indexOf(target))),
    ]);
    const batch = store.dispatch(
      fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]),
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(store.getState().counter.byAccount[uuidOf(0)]?.value).toBe(0);
    expect(store.getState().counter.status[uuidOf(1)]?.pending).toBe(true);
    gate.resolve(1);
    await batch;
    expect(store.getState().counter.byAccount[uuidOf(1)]?.value).toBe(1);
  });

  it("keeps the other accounts going when storing one answer throws", async () => {
    const { source } = batchSource();
    const store = makeStore([source]);
    const throwing = {
      ...counterBinding,
      received: (payload: Parameters<typeof counterBinding.received>[0]) => {
        if (payload.accountUUID === uuidOf(0)) throw new Error("reducer broke");
        return counterBinding.received(payload);
      },
    };
    await store.dispatch(fetchAccountDataBatch(throwing, [descriptorOf(0), descriptorOf(1)]));
    const { byAccount, status } = store.getState().counter;
    expect(status[uuidOf(0)]?.error).toBe("reducer broke");
    expect(byAccount[uuidOf(1)]?.value).toBe(1);
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0)]));
    expect(byAccount[uuidOf(0)]).toBeUndefined();
    expect(store.getState().counter.byAccount[uuidOf(0)]?.value).toBe(0);
  });

  it("stores the error on every account when the app did not inject the router", async () => {
    const store = makeStore([], {});
    await store.dispatch(fetchAccountDataBatch(counterBinding, [descriptorOf(0), descriptorOf(1)]));
    const { status } = store.getState().counter;
    expect(status[uuidOf(0)]?.error).toMatch(/No account data router/);
    expect(status[uuidOf(1)]?.error).toMatch(/No account data router/);
  });

  it("is what single reads dispatched together amount to on a batch source", async () => {
    const { source, calls } = batchSource();
    const store = makeStore([source]);
    await Promise.all(
      [0, 1, 2].map(index => store.dispatch(fetchAccountData(counterBinding, descriptorOf(index)))),
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(3);
  });
});
