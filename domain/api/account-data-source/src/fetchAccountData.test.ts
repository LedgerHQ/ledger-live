import {
  accountId,
  counterBinding,
  descriptor,
  feedBinding,
  makeStore,
  type FeedPage,
} from "./testing/toyData";
import { fetchAccountData } from "./fetchAccountData";
import type { AccountDataSource } from "./source";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

const page = (items: string[], nextCursor?: string): FeedPage => ({
  items,
  ...(nextCursor === undefined ? {} : { nextCursor }),
});

const counterSource = (counter: AccountDataSource["counter"]): AccountDataSource => ({
  id: "s",
  supports: () => true,
  counter,
});

describe("fetchAccountData", () => {
  describe("a head read", () => {
    it("stores what the chosen source answered, and which source it was", async () => {
      const store = makeStore([counterSource(async () => 7)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.byAccount[accountId]?.value).toBe(7);
      expect(store.getState().counter.status[accountId]).toEqual({ pending: false, sourceId: "s" });
    });

    it("records a failure when no source can answer", async () => {
      const store = makeStore([{ id: "nothing", supports: () => false }]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.status[accountId]?.error).toMatch(
        /No account counter source/,
      );
    });

    it("records a failure when the app forgot to inject the router", async () => {
      const store = makeStore([], {});
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(store.getState().counter.status[accountId]?.error).toMatch(/No account data router/);
    });

    it("does not repeat a read younger than maxAge, and repeats it with maxAge 0", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      await store.dispatch(fetchAccountData(counterBinding, descriptor));
      expect(counter).toHaveBeenCalledTimes(1);
      await store.dispatch(fetchAccountData(counterBinding, descriptor, { maxAge: 0 }));
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("treats a stamp from the future as stale rather than fresh", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      const ahead = { ...counterBinding, selectAt: () => Date.now() + 3_600_000 };
      await store.dispatch(fetchAccountData(ahead, descriptor));
      await store.dispatch(fetchAccountData(ahead, descriptor));
      expect(counter).toHaveBeenCalledTimes(2);
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

    it("keeps two datums of one account independent", async () => {
      const store = makeStore([
        { id: "s", supports: () => true, counter: async () => 1, feed: async () => page(["a"]) },
      ]);
      await Promise.all([
        store.dispatch(fetchAccountData(counterBinding, descriptor)),
        store.dispatch(fetchAccountData(feedBinding, descriptor)),
      ]);
      expect(store.getState().counter.byAccount[accountId]?.value).toBe(1);
      expect(store.getState().feed.byAccount[accountId]?.value.items).toEqual(["a"]);
    });

    it("passes the query through to the source", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 10 } }));
      expect(feed).toHaveBeenCalledWith(
        expect.objectContaining({ accountId, descriptor }),
        { limit: 10 },
        undefined,
      );
    });
  });

  describe("a next page", () => {
    it("resumes from the stored cursor, keeps the page size and merges the page", async () => {
      const feed = jest.fn(async (_target: unknown, query?: { cursor?: string }) =>
        query?.cursor === "c1" ? page(["b"]) : page(["a"], "c1"),
      );
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { query: { limit: 1 } }));
      await store.dispatch(
        fetchAccountData(feedBinding, descriptor, { query: { limit: 1 }, more: true }),
      );
      expect(feed).toHaveBeenLastCalledWith(
        expect.objectContaining({ accountId, descriptor }),
        { limit: 1, cursor: "c1" },
        undefined,
      );
      expect(store.getState().feed.byAccount[accountId]?.value.items).toEqual(["a", "b"]);
    });

    it("does nothing once the stream is exhausted", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(feed).toHaveBeenCalledTimes(1);
    });

    it("does nothing on a datum that is not paginated", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, descriptor, { more: true }));
      expect(counter).not.toHaveBeenCalled();
    });

    it("is not guarded by freshness: reaching the bottom always reads", async () => {
      const feed = jest.fn(async (_target: unknown, query?: { cursor?: string }) =>
        query?.cursor ? page([query.cursor], `${query.cursor}x`) : page(["a"], "c"),
      );
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(feed).toHaveBeenCalledTimes(3);
    });

    it("asks only the source that answered the head, never hands its cursor to another", async () => {
      let granularOn = false;
      const granular = jest.fn(async () => page(["granular"]));
      const store = makeStore([
        { id: "granular", supports: () => granularOn, feed: granular },
        {
          id: "paged",
          supports: () => true,
          feed: async (_target, query) =>
            query?.cursor ? page(["b"]) : page(["a"], "paged-cursor"),
        },
      ]);
      await store.dispatch(fetchAccountData(feedBinding, descriptor));
      granularOn = true;
      await store.dispatch(fetchAccountData(feedBinding, descriptor, { more: true }));
      expect(granular).not.toHaveBeenCalled();
      expect(store.getState().feed.status[accountId]?.sourceId).toBe("paged");
    });
  });
});
