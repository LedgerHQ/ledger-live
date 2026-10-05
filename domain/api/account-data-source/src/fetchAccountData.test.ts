import { counterBinding, feedBinding, makeStore, ref, type FeedPage } from "./testing/toyData";
import { fetchAccountData } from "./fetchAccountData";
import type { AccountDataSource } from "./source";

const { accountId } = ref;

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
      await store.dispatch(fetchAccountData(counterBinding, ref));
      expect(store.getState().counter.byAccount[accountId]?.value).toBe(7);
      expect(store.getState().counter.status[accountId]).toEqual({ pending: false, sourceId: "s" });
    });

    it("records a failure when no source can answer", async () => {
      const store = makeStore([{ id: "nothing", supports: () => false }]);
      await store.dispatch(fetchAccountData(counterBinding, ref));
      expect(store.getState().counter.status[accountId]?.error).toMatch(
        /No account counter source/,
      );
    });

    it("records a failure when the app forgot to inject the router", async () => {
      const store = makeStore([], {});
      await store.dispatch(fetchAccountData(counterBinding, ref));
      expect(store.getState().counter.status[accountId]?.error).toMatch(/No account data router/);
    });

    it("does not repeat a read younger than maxAge, and repeats it with maxAge 0", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, ref));
      await store.dispatch(fetchAccountData(counterBinding, ref));
      expect(counter).toHaveBeenCalledTimes(1);
      await store.dispatch(fetchAccountData(counterBinding, ref, { maxAge: 0 }));
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("treats a stamp from the future as stale rather than fresh", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      const ahead = { ...counterBinding, selectAt: () => Date.now() + 3_600_000 };
      await store.dispatch(fetchAccountData(ahead, ref));
      await store.dispatch(fetchAccountData(ahead, ref));
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("joins a read already in flight for the same ref", async () => {
      const gate = deferred<number>();
      const counter = jest.fn(() => gate.promise);
      const store = makeStore([counterSource(counter)]);
      const first = store.dispatch(fetchAccountData(counterBinding, ref));
      const second = store.dispatch(fetchAccountData(counterBinding, ref));
      gate.resolve(1);
      await Promise.all([first, second]);
      expect(counter).toHaveBeenCalledTimes(1);
    });

    it("does not drop a read for another ref of the same account", async () => {
      const gate = deferred<number>();
      const counter = jest.fn(() => gate.promise);
      const store = makeStore([counterSource(counter)]);
      const first = store.dispatch(fetchAccountData(counterBinding, ref));
      const second = store.dispatch(
        fetchAccountData(counterBinding, { ...ref, address: "0xrotated" }),
      );
      gate.resolve(1);
      await Promise.all([first, second]);
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("keeps two datums of one account independent", async () => {
      const store = makeStore([
        { id: "s", supports: () => true, counter: async () => 1, feed: async () => page(["a"]) },
      ]);
      await Promise.all([
        store.dispatch(fetchAccountData(counterBinding, ref)),
        store.dispatch(fetchAccountData(feedBinding, ref)),
      ]);
      expect(store.getState().counter.byAccount[accountId]?.value).toBe(1);
      expect(store.getState().feed.byAccount[accountId]?.value.items).toEqual(["a"]);
    });

    it("passes the query through to the source", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, ref, { query: { limit: 10 } }));
      expect(feed).toHaveBeenCalledWith(ref, { limit: 10 }, undefined);
    });
  });

  describe("a next page", () => {
    it("resumes from the stored cursor, keeps the page size and merges the page", async () => {
      const feed = jest.fn(async (_ref: unknown, query?: { cursor?: string }) =>
        query?.cursor === "c1" ? page(["b"]) : page(["a"], "c1"),
      );
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, ref, { query: { limit: 1 } }));
      await store.dispatch(fetchAccountData(feedBinding, ref, { query: { limit: 1 }, more: true }));
      expect(feed).toHaveBeenLastCalledWith(ref, { limit: 1, cursor: "c1" }, undefined);
      expect(store.getState().feed.byAccount[accountId]?.value.items).toEqual(["a", "b"]);
    });

    it("does nothing once the stream is exhausted", async () => {
      const feed = jest.fn(async () => page(["a"]));
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, ref));
      await store.dispatch(fetchAccountData(feedBinding, ref, { more: true }));
      expect(feed).toHaveBeenCalledTimes(1);
    });

    it("does nothing on a datum that is not paginated", async () => {
      const counter = jest.fn(async () => 1);
      const store = makeStore([counterSource(counter)]);
      await store.dispatch(fetchAccountData(counterBinding, ref, { more: true }));
      expect(counter).not.toHaveBeenCalled();
    });

    it("is not guarded by freshness: reaching the bottom always reads", async () => {
      const feed = jest.fn(async (_ref: unknown, query?: { cursor?: string }) =>
        query?.cursor ? page([query.cursor], `${query.cursor}x`) : page(["a"], "c"),
      );
      const store = makeStore([{ id: "s", supports: () => true, feed }]);
      await store.dispatch(fetchAccountData(feedBinding, ref));
      await store.dispatch(fetchAccountData(feedBinding, ref, { more: true }));
      await store.dispatch(fetchAccountData(feedBinding, ref, { more: true }));
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
          feed: async (_ref, query) => (query?.cursor ? page(["b"]) : page(["a"], "paged-cursor")),
        },
      ]);
      await store.dispatch(fetchAccountData(feedBinding, ref));
      granularOn = true;
      await store.dispatch(fetchAccountData(feedBinding, ref, { more: true }));
      expect(granular).not.toHaveBeenCalled();
      expect(store.getState().feed.status[accountId]?.sourceId).toBe("paged");
    });
  });
});
