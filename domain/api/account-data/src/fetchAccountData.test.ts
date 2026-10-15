import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { fetchAccountData, fetchMoreAccountData } from "./fetchAccountData";
import type { AccountDataSource, AccountTarget } from "./source";
import {
  accountUUID,
  descriptor,
  descriptorOf,
  indexOf,
  makeStore,
  sourceIdOf,
  type FeedPage,
  type FeedQuery,
} from "./testing";

const uuidOf = (index: number) => computeAccountUUID(descriptorOf(index));

const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

const counterSource = (counter: (target: AccountTarget) => Promise<number>): AccountDataSource => ({
  id: sourceIdOf("s"),
  supports: () => true,
  read: { counter },
});

const feedSource = (
  feed: (target: AccountTarget, query: FeedQuery | undefined) => Promise<FeedPage>,
  id = sourceIdOf("s"),
): AccountDataSource => ({ id, supports: () => true, read: { feed } });

/** Pages of `items` one item each, chained by cursors `c1`, `c2`… */
const pages = (items: string[]) =>
  jest.fn(async (target: AccountTarget): Promise<FeedPage> => {
    const index = target.cursor === undefined ? 0 : Number(target.cursor.slice(1));
    const nextCursor = index + 1 < items.length ? `c${index + 1}` : undefined;
    return nextCursor === undefined
      ? { items: [items[index]] }
      : { items: [items[index]], nextCursor };
  });

describe("fetchAccountData", () => {
  it("stores the answer in the entity slice, and how it went in the status", async () => {
    const store = makeStore([counterSource(async () => 7)]);
    await store.dispatch(fetchAccountData("counter", descriptor));
    expect(store.getState().counter[accountUUID]).toBe(7);
    expect(store.getState().accountData.counter?.[accountUUID]).toEqual({
      sourceId: sourceIdOf("s"),
      queryKey: "",
      readAt: expect.any(Number),
    });
  });

  it("stores the error with its name when no source can answer, and keeps the stored data", async () => {
    const answers = [async () => 1, async () => Promise.reject(new TypeError("down"))];
    const store = makeStore([counterSource(() => (answers.shift() ?? answers[0])())]);
    await store.dispatch(fetchAccountData("counter", descriptor));
    await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
    expect(store.getState().counter[accountUUID]).toBe(1);
    expect(store.getState().accountData.counter?.[accountUUID]?.error).toEqual({
      name: "TypeError",
      message: "down",
    });
  });

  it("names NoAccountDataSourceError when no source serves the account", async () => {
    const store = makeStore([{ id: sourceIdOf("nothing"), supports: () => false }]);
    await store.dispatch(fetchAccountData("counter", descriptor));
    expect(store.getState().accountData.counter?.[accountUUID]?.error?.name).toBe(
      "NoAccountDataSourceError",
    );
  });

  it("throws when the app did not inject the router", async () => {
    const store = makeStore([], {});
    await expect(store.dispatch(fetchAccountData("counter", descriptor))).rejects.toThrow(
      /No account data router/,
    );
  });

  it("skips a read younger than maxAge, and reads with maxAge 0", async () => {
    const counter = jest.fn(async () => 1);
    const store = makeStore([counterSource(counter)]);
    await store.dispatch(fetchAccountData("counter", descriptor));
    await store.dispatch(fetchAccountData("counter", descriptor));
    expect(counter).toHaveBeenCalledTimes(1);
    await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("reads again once maxAge has passed, and on a stamp from the future", async () => {
    jest.useFakeTimers({ now: 10_000, doNotFake: ["queueMicrotask", "nextTick", "setImmediate"] });
    try {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 1000 }));
      jest.setSystemTime(10_999);
      await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 1000 }));
      expect(counter).toHaveBeenCalledTimes(1);
      jest.setSystemTime(11_000);
      await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 1000 }));
      expect(counter).toHaveBeenCalledTimes(2);
      jest.setSystemTime(0);
      await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 1000 }));
      expect(counter).toHaveBeenCalledTimes(3);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reads a new query even when another query's data is fresh", async () => {
    const feed = jest.fn(async () => ({ items: ["a"] }));
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 1 } }));
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 2 } }));
    expect(feed).toHaveBeenCalledTimes(2);
  });

  it("reads a query again after it failed, even when another query's data is fresh", async () => {
    const feed = jest
      .fn<Promise<FeedPage>, [AccountTarget, FeedQuery | undefined]>()
      .mockResolvedValueOnce({ items: ["a"] })
      .mockRejectedValueOnce(new Error("down"))
      .mockResolvedValueOnce({ items: ["b"] });
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 1 } }));
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 2 } }));
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 2 } }));
    expect(feed).toHaveBeenCalledTimes(3);
    expect(store.getState().feed[accountUUID]).toEqual(["b"]);
  });

  it("joins a read in flight, and resolves only once its answer is stored", async () => {
    const gate = deferred<number>();
    const counter = jest.fn(() => gate.promise);
    const store = makeStore([counterSource(counter)]);
    const first = store.dispatch(fetchAccountData("counter", descriptor));
    await tick();
    let joinedDone = false;
    const joined = store
      .dispatch(fetchAccountData("counter", descriptor))
      .then(() => (joinedDone = true));
    await tick();
    expect(joinedDone).toBe(false);
    gate.resolve(5);
    await Promise.all([first, joined]);
    expect(counter).toHaveBeenCalledTimes(1);
    expect(store.getState().counter[accountUUID]).toBe(5);
  });

  it("lets what reacts to the request join it, and resolves it only once stored", async () => {
    const gate = deferred<number>();
    const counter = jest.fn(() => gate.promise);
    const store = makeStore([counterSource(counter)]);
    let joined: Promise<void> | undefined;
    const unsubscribe = store.subscribe(() => {
      joined ??= store.dispatch(fetchAccountData("counter", descriptor));
    });
    const first = store.dispatch(fetchAccountData("counter", descriptor));
    unsubscribe();
    let joinedDone = false;
    void joined?.then(() => (joinedDone = true));
    await tick();
    expect(joinedDone).toBe(false);
    gate.resolve(3);
    await Promise.all([first, joined]);
    expect(counter).toHaveBeenCalledTimes(1);
    expect(joinedDone).toBe(true);
  });

  it("keeps a joined dispatch waiting through the newer read that replaced the one it joined", async () => {
    const gates = [deferred<number>(), deferred<number>()];
    const counter = jest
      .fn()
      .mockReturnValueOnce(gates[0].promise)
      .mockReturnValueOnce(gates[1].promise);
    const store = makeStore([counterSource(counter)]);
    const first = store.dispatch(fetchAccountData("counter", descriptor));
    await tick();
    let joinedDone = false;
    const joined = store
      .dispatch(fetchAccountData("counter", descriptor))
      .then(() => (joinedDone = true));
    const newer = store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
    gates[0].resolve(1);
    await tick();
    expect(joinedDone).toBe(false);
    expect(store.getState().counter[accountUUID]).toBeUndefined();
    gates[1].resolve(2);
    await Promise.all([first, joined, newer]);
    expect(store.getState().counter[accountUUID]).toBe(2);
  });

  it("reads a new query while the previous one is in flight, and drops the stale answer", async () => {
    const old = deferred<FeedPage>();
    const feed = jest.fn((_target: AccountTarget, query?: FeedQuery) =>
      query?.limit === 1 ? old.promise : Promise.resolve({ items: ["new"] }),
    );
    const store = makeStore([feedSource(feed)]);
    const stale = store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 1 } }));
    await tick();
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 2 } }));
    old.resolve({ items: ["old"] });
    await stale;
    expect(store.getState().feed[accountUUID]).toEqual(["new"]);
    expect(store.getState().accountData.feed?.[accountUUID]?.queryKey).toBe('{"limit":2}');
  });

  it("does not leave the account pending when what reacts to the answer throws", async () => {
    const counter = jest.fn(async () => 1);
    const store = makeStore([counterSource(counter)]);
    const unsubscribe = store.subscribe(() => {
      if (store.getState().counter[accountUUID] === 1) throw new Error("listener broke");
    });
    await expect(store.dispatch(fetchAccountData("counter", descriptor))).resolves.toBeUndefined();
    unsubscribe();
    expect(store.getState().accountData.counter?.[accountUUID]?.request).toBeUndefined();
    await store.dispatch(fetchAccountData("counter", descriptor, { maxAge: 0 }));
    expect(counter).toHaveBeenCalledTimes(2);
  });

  it("keeps two kinds of one account independent", async () => {
    const gate = deferred<number>();
    const store = makeStore([
      {
        id: sourceIdOf("s"),
        supports: () => true,
        read: { counter: () => gate.promise, feed: async () => ({ items: ["a"] }) },
      },
    ]);
    const counter = store.dispatch(fetchAccountData("counter", descriptor));
    await store.dispatch(fetchAccountData("feed", descriptor));
    expect(store.getState().feed[accountUUID]).toEqual(["a"]);
    gate.resolve(1);
    await counter;
    expect(store.getState().counter[accountUUID]).toBe(1);
  });

  it("reads the accounts dispatched in one tick in one batch call, each stored as soon as it answers", async () => {
    const slow = deferred<void>();
    const calls: number[][] = [];
    const store = makeStore([
      {
        id: sourceIdOf("batch"),
        supports: () => true,
        maxBatchSize: 2,
        readBatch: {
          counter: async targets => {
            calls.push(targets.map(indexOf));
            if (targets.some(target => indexOf(target) === 2)) await slow.promise;
            return targets.map(target => ({ status: "fulfilled", value: indexOf(target) }));
          },
        },
      },
    ]);
    const all = Promise.all(
      [0, 1, 2].map(index => store.dispatch(fetchAccountData("counter", descriptorOf(index)))),
    );
    await tick();
    expect(calls).toEqual([[0, 1], [2]]);
    expect(store.getState().counter[uuidOf(1)]).toBe(1);
    expect(store.getState().accountData.counter?.[uuidOf(2)]?.request).toBeDefined();
    slow.resolve();
    await all;
    expect(store.getState().counter[uuidOf(2)]).toBe(2);
  });
});

describe("fetchMoreAccountData", () => {
  it("reads the next page from the stored cursor and source, and appends it", async () => {
    const feed = pages(["a", "b", "c"]);
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 1 } }));
    await store.dispatch(fetchMoreAccountData("feed", descriptor, { query: { limit: 1 } }));
    expect(feed).toHaveBeenLastCalledWith({ accountUUID, descriptor, cursor: "c1" }, { limit: 1 });
    expect(store.getState().feed[accountUUID]).toEqual(["a", "b"]);
    expect(store.getState().accountData.feed?.[accountUUID]?.nextCursor).toBe("c2");
  });

  it("does nothing at the end of the pages, nor on a kind without pages", async () => {
    const feed = pages(["a"]);
    const counter = jest.fn(async () => 1);
    const store = makeStore([
      { id: sourceIdOf("s"), supports: () => true, read: { feed, counter } },
    ]);
    await store.dispatch(fetchAccountData("feed", descriptor));
    await store.dispatch(fetchMoreAccountData("feed", descriptor));
    await store.dispatch(fetchAccountData("counter", descriptor));
    await store.dispatch(fetchMoreAccountData("counter", descriptor));
    expect(feed).toHaveBeenCalledTimes(1);
    expect(counter).toHaveBeenCalledTimes(1);
  });

  it("does nothing before a head read, for another query than the stored one, or during a head read", async () => {
    const gate = deferred<FeedPage>();
    const feed = jest
      .fn<Promise<FeedPage>, [AccountTarget, FeedQuery | undefined]>()
      .mockResolvedValueOnce({ items: ["a"], nextCursor: "c1" })
      .mockReturnValueOnce(gate.promise);
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchMoreAccountData("feed", descriptor));
    await store.dispatch(fetchAccountData("feed", descriptor, { query: { limit: 1 } }));
    await store.dispatch(fetchMoreAccountData("feed", descriptor, { query: { limit: 2 } }));
    const refreshing = store.dispatch(
      fetchAccountData("feed", descriptor, { query: { limit: 1 }, maxAge: 0 }),
    );
    const more = store.dispatch(fetchMoreAccountData("feed", descriptor, { query: { limit: 1 } }));
    gate.resolve({ items: ["a"] });
    await Promise.all([refreshing, more]);
    expect(feed).toHaveBeenCalledTimes(2);
  });

  it("waits for a page already on its way", async () => {
    const next = deferred<FeedPage>();
    const feed = jest.fn(async (target: AccountTarget): Promise<FeedPage> =>
      target.cursor === undefined ? { items: ["a"], nextCursor: "c1" } : next.promise,
    );
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchAccountData("feed", descriptor));
    const first = store.dispatch(fetchMoreAccountData("feed", descriptor));
    let secondDone = false;
    const second = store
      .dispatch(fetchMoreAccountData("feed", descriptor))
      .then(() => (secondDone = true));
    await tick();
    expect(secondDone).toBe(false);
    next.resolve({ items: ["b"] });
    await Promise.all([first, second]);
    expect(feed).toHaveBeenCalledTimes(2);
    expect(store.getState().feed[accountUUID]).toEqual(["a", "b"]);
  });

  it("asks only the source that answered the head", async () => {
    const preferred = jest.fn(async (): Promise<FeedPage> => ({ items: ["x"] }));
    const head = pages(["a", "b"]);
    const store = makeStore([
      {
        id: sourceIdOf("preferred"),
        // Becomes the first choice once the head is read, so only pinning keeps the next page away.
        supports: (_d, kind) => kind === "feed" && head.mock.calls.length > 0,
        read: { feed: preferred },
      },
      feedSource(head, sourceIdOf("answered")),
    ]);
    await store.dispatch(fetchAccountData("feed", descriptor));
    await store.dispatch(fetchMoreAccountData("feed", descriptor));
    expect(preferred).not.toHaveBeenCalled();
    expect(store.getState().feed[accountUUID]).toEqual(["a", "b"]);
  });

  it("drops a next page answering after a newer head read started", async () => {
    const next = deferred<FeedPage>();
    const feed = jest.fn(async (target: AccountTarget): Promise<FeedPage> =>
      target.cursor === undefined ? { items: ["head"], nextCursor: "c1" } : next.promise,
    );
    const store = makeStore([feedSource(feed)]);
    await store.dispatch(fetchAccountData("feed", descriptor));
    const more = store.dispatch(fetchMoreAccountData("feed", descriptor));
    await tick();
    await store.dispatch(fetchAccountData("feed", descriptor, { maxAge: 0 }));
    next.resolve({ items: ["late"] });
    await more;
    expect(store.getState().feed[accountUUID]).toEqual(["head"]);
  });

  it("can be asked by what reacts to the head being stored", async () => {
    const store = makeStore([feedSource(pages(["a", "b"]))]);
    let paged: Promise<void> | undefined;
    store.subscribe(() => {
      if (paged || !store.getState().feed[accountUUID]) return;
      paged = store.dispatch(fetchMoreAccountData("feed", descriptor));
    });
    await store.dispatch(fetchAccountData("feed", descriptor));
    await paged;
    expect(store.getState().feed[accountUUID]).toEqual(["a", "b"]);
  });
});
