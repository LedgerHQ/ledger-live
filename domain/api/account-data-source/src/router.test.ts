import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { AccountDataAbortedError, NoAccountDataSourceError } from "./errors";
import { createAccountDataRouter } from "./router";
import type { AccountDataSource, AccountTarget } from "./source";
import { accountUUID, descriptor, descriptorOf, indexOf } from "./testing";

const descriptors = (count: number, network?: string) =>
  Array.from({ length: count }, (_, index) => descriptorOf(index, network));

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

function gate() {
  let open: () => void = () => undefined;
  const opened = new Promise<void>(resolve => (open = resolve));
  return { opened, open };
}

/** A source with only a batch reader, recording the descriptors of each call. */
function batchSource(over: Partial<AccountDataSource> = {}) {
  const calls: AccountDescriptor[][] = [];
  const source: AccountDataSource = {
    id: "batch",
    supports: () => true,
    readBatch: {
      counter: async targets => {
        calls.push(targets.map(target => target.descriptor));
        return targets.map(target => ({ status: "fulfilled", value: indexOf(target) }));
      },
    },
    ...over,
  };
  return { source, calls };
}

/** A source with only a single reader, held until released, recording the peak of reads at once. */
function singleSource(id = "single", over: Partial<AccountDataSource> = {}) {
  let active = 0;
  let peak = 0;
  const { opened, open } = gate();
  const counter = jest.fn(async (target: AccountTarget) => {
    active++;
    peak = Math.max(peak, active);
    await opened;
    active--;
    return indexOf(target);
  });
  const source: AccountDataSource = { id, supports: () => true, read: { counter }, ...over };
  return { source, counter, peak: () => peak, release: open };
}

describe("createAccountDataRouter", () => {
  describe("ranking", () => {
    it("asks the first source that has a reader and supports the account", async () => {
      const router = createAccountDataRouter([
        { id: "a", supports: () => false, read: { counter: async () => 1 } },
        { id: "b", supports: () => true, read: { counter: async () => 2 } },
        { id: "c", supports: () => true, read: { counter: async () => 3 } },
      ]);
      expect(await router.read("counter", descriptor)).toEqual({ data: 2, sourceId: "b" });
    });

    it("skips a source without a reader for the kind, without asking it", async () => {
      const supports = jest.fn(() => true);
      const router = createAccountDataRouter([
        { id: "feed-only", supports, read: { feed: async () => ({ items: [] }) } },
        { id: "full", supports: () => true, read: { counter: async () => 1 } },
      ]);
      expect((await router.read("counter", descriptor)).sourceId).toBe("full");
      expect(supports).not.toHaveBeenCalled();
    });

    it("lets a source support one kind and not another for the same account", async () => {
      const router = createAccountDataRouter([
        {
          id: "granular",
          supports: (_descriptor, kind) => kind === "counter",
          read: { counter: async () => 1, feed: async () => ({ items: ["granular"] }) },
        },
        { id: "fallback", supports: () => true, read: { feed: async () => ({ items: [] }) } },
      ]);
      expect((await router.read("counter", descriptor)).sourceId).toBe("granular");
      expect((await router.read("feed", descriptor)).sourceId).toBe("fallback");
    });

    it("hands the reader the account UUID, the descriptor and the query", async () => {
      const feed = jest.fn(async () => ({ items: [] }));
      const router = createAccountDataRouter([{ id: "a", supports: () => true, read: { feed } }]);
      await router.read("feed", descriptor, { query: { limit: 10 } });
      expect(feed).toHaveBeenCalledWith({ accountUUID, descriptor }, { limit: 10 }, undefined);
    });

    it("rejects with NoAccountDataSourceError when no source can answer", async () => {
      const router = createAccountDataRouter([{ id: "a", supports: () => false }]);
      await expect(router.read("counter", descriptor)).rejects.toBeInstanceOf(
        NoAccountDataSourceError,
      );
    });

    it("never prefers a lower-ranked source because it can batch", async () => {
      const single = singleSource("first");
      single.release();
      const { source: batch, calls } = batchSource({ id: "second" });
      const router = createAccountDataRouter([single.source, batch]);
      await router.readBatch("counter", descriptors(3));
      expect(single.counter).toHaveBeenCalledTimes(3);
      expect(calls).toHaveLength(0);
    });

    it("splits the accounts between the sources first for each", async () => {
      const { source: evm, calls } = batchSource({
        id: "evm",
        supports: account => account.network.name === "ethereum",
      });
      const fallback = singleSource("fallback");
      fallback.release();
      const router = createAccountDataRouter([evm, fallback.source]);
      const answers = await router.readBatch("counter", [
        descriptorOf(0),
        descriptorOf(1, "bitcoin"),
        descriptorOf(2),
      ]);
      expect(calls).toEqual([[descriptorOf(0), descriptorOf(2)]]);
      expect(fallback.counter).toHaveBeenCalledTimes(1);
      expect(answers.map(answer => answer.status === "fulfilled" && answer.value.sourceId)).toEqual(
        ["evm", "fallback", "evm"],
      );
    });

    it("rejects only the accounts no source can answer", async () => {
      const { source } = batchSource({ supports: account => account.network.name === "ethereum" });
      const router = createAccountDataRouter([source]);
      const [served, orphan] = await router.readBatch("counter", [
        descriptorOf(0),
        descriptorOf(1, "bitcoin"),
      ]);
      expect(served.status).toBe("fulfilled");
      expect(orphan.status === "rejected" && orphan.reason).toBeInstanceOf(
        NoAccountDataSourceError,
      );
    });
  });

  describe("pagination affinity", () => {
    it("only asks the pinned source, even when a higher-ranked one could answer", async () => {
      const router = createAccountDataRouter([
        { id: "first", supports: () => true, read: { counter: async () => 1 } },
        { id: "second", supports: () => true, read: { counter: async () => 2 } },
      ]);
      expect(await router.read("counter", descriptor, { sourceId: "second" })).toEqual({
        data: 2,
        sourceId: "second",
      });
    });

    it("fails rather than falling back when the pinned source no longer serves the account", async () => {
      const router = createAccountDataRouter([
        { id: "first", supports: () => true, read: { counter: async () => 1 } },
        { id: "gone", supports: () => false, read: { counter: async () => 2 } },
      ]);
      await expect(router.read("counter", descriptor, { sourceId: "gone" })).rejects.toBeInstanceOf(
        NoAccountDataSourceError,
      );
    });
  });

  describe("coalescing single reads", () => {
    it("answers each caller as soon as its own source answers", async () => {
      const slow = singleSource("slow", {
        supports: account => account.network.name === "bitcoin",
      });
      const router = createAccountDataRouter([
        slow.source,
        { id: "fast", supports: () => true, read: { counter: async () => 1 } },
      ]);
      const fast = router.read("counter", descriptorOf(0));
      const blocked = router.read("counter", descriptorOf(1, "bitcoin"));
      await expect(fast).resolves.toEqual({ data: 1, sourceId: "fast" });
      slow.release();
      await expect(blocked).resolves.toEqual({ data: 1, sourceId: "slow" });
    });

    it("answers the accounts of one chunk without waiting for the other chunks", async () => {
      const { opened, open } = gate();
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          maxBatchSize: 1,
          readBatch: {
            counter: async targets => {
              if (indexOf(targets[0]) === 1) await opened;
              return targets.map(target => ({ status: "fulfilled", value: indexOf(target) }));
            },
          },
        },
      ]);
      const [first, second] = [descriptorOf(0), descriptorOf(1)].map(each =>
        router.read("counter", each),
      );
      await expect(first).resolves.toEqual({ data: 0, sourceId: "s" });
      open();
      await expect(second).resolves.toEqual({ data: 1, sourceId: "s" });
    });

    it("reads the reads of one tick together, in one batch call", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      const answers = await Promise.all(descriptors(3).map(each => router.read("counter", each)));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toHaveLength(3);
      expect(answers.map(answer => answer.data)).toEqual([0, 1, 2]);
    });

    it("keeps reads of separate ticks apart", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      await router.read("counter", descriptorOf(0));
      await router.read("counter", descriptorOf(1));
      expect(calls).toHaveLength(2);
    });

    it("does not coalesce reads with different queries, whatever the key order", async () => {
      const feed = jest.fn(async (targets: readonly AccountTarget[]) =>
        targets.map(() => ({ status: "fulfilled" as const, value: { items: [] } })),
      );
      const router = createAccountDataRouter([
        { id: "s", supports: () => true, readBatch: { feed } },
      ]);
      await Promise.all([
        router.read("feed", descriptorOf(0), { query: { limit: 10, cursor: "c" } }),
        router.read("feed", descriptorOf(1), { query: { limit: 20 } }),
        router.read("feed", descriptorOf(2), { query: { cursor: "c", limit: 10 } }),
      ]);
      expect(feed.mock.calls.map(([targets]) => targets.length).sort()).toEqual([1, 2]);
    });

    it("reads an account asked twice once, and answers both callers", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      const [first, second] = await Promise.all([
        router.read("counter", descriptorOf(4)),
        router.read("counter", descriptorOf(4)),
      ]);
      expect(calls).toEqual([[descriptorOf(4)]]);
      expect(first.data).toBe(4);
      expect(second.data).toBe(4);
    });

    it("answers a single read on a source that only batches", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      expect(await router.read("counter", descriptorOf(3))).toEqual({ data: 3, sourceId: "batch" });
      expect(calls).toEqual([[descriptorOf(3)]]);
    });
  });

  describe("without a batch reader", () => {
    it("calls the single reader once per account, at most the source's concurrency at once", async () => {
      const { source, counter, peak, release } = singleSource("single", { concurrency: 2 });
      const router = createAccountDataRouter([source]);
      const reading = router.readBatch("counter", descriptors(6));
      await settle();
      expect(peak()).toBe(2);
      release();
      const answers = await reading;
      expect(counter).toHaveBeenCalledTimes(6);
      expect(answers.every(answer => answer.status === "fulfilled")).toBe(true);
    });

    it("caps each source at the default of 4, across separate calls", async () => {
      const { source, peak, release } = singleSource();
      const router = createAccountDataRouter([source]);
      const both = Promise.all([
        router.readBatch("counter", descriptors(5)),
        router.readBatch("counter", descriptors(5, "bitcoin")),
      ]);
      await settle();
      expect(peak()).toBe(4);
      release();
      await both;
    });

    it("lets one account fail without failing the others", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          read: {
            counter: async target => {
              if (indexOf(target) === 1) throw new Error("explorer down");
              return indexOf(target);
            },
          },
        },
      ]);
      const answers = await router.readBatch("counter", descriptors(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });
  });

  describe("with a batch reader", () => {
    it("answers in the order asked", async () => {
      const { source } = batchSource();
      const router = createAccountDataRouter([source]);
      expect(await router.readBatch("counter", [descriptorOf(2), descriptorOf(0)])).toEqual([
        { status: "fulfilled", value: { data: 2, sourceId: "batch" } },
        { status: "fulfilled", value: { data: 0, sourceId: "batch" } },
      ]);
    });

    it("splits a batch larger than maxBatchSize", async () => {
      const { source, calls } = batchSource({ maxBatchSize: 2 });
      const router = createAccountDataRouter([source]);
      await router.readBatch("counter", descriptors(5));
      expect(calls.map(call => call.length)).toEqual([2, 2, 1]);
    });

    it("keeps one account's failure to that account", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          readBatch: {
            counter: async targets =>
              targets.map(target =>
                indexOf(target) === 1
                  ? { status: "rejected", reason: new Error("unknown address") }
                  : { status: "fulfilled", value: indexOf(target) },
              ),
          },
        },
      ]);
      const answers = await router.readBatch("counter", descriptors(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });

    it("fails only the chunk whose call rejected, without retrying it account by account", async () => {
      const counter = jest.fn(async (targets: readonly AccountTarget[]) => {
        if (targets.some(target => indexOf(target) === 2)) throw new Error("timeout");
        return targets.map(target => ({ status: "fulfilled" as const, value: indexOf(target) }));
      });
      const router = createAccountDataRouter([
        { id: "s", supports: () => true, maxBatchSize: 2, readBatch: { counter } },
      ]);
      const answers = await router.readBatch("counter", descriptors(4));
      expect(answers.map(answer => answer.status)).toEqual([
        "fulfilled",
        "fulfilled",
        "rejected",
        "rejected",
      ]);
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("fails the chunk when the source answers the wrong number of results", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          readBatch: { counter: async () => [{ status: "fulfilled", value: 1 }] },
        },
      ]);
      const answers = await router.readBatch("counter", descriptors(2));
      expect(answers.every(answer => answer.status === "rejected")).toBe(true);
      expect(answers[0].status === "rejected" && String(answers[0].reason)).toMatch(
        /answered 1 results for 2 accounts/,
      );
    });
  });

  describe("abort", () => {
    it("rejects at once with an already aborted signal", async () => {
      const { source } = batchSource();
      const router = createAccountDataRouter([source]);
      const controller = new AbortController();
      controller.abort();
      await expect(
        router.read("counter", descriptor, { signal: controller.signal }),
      ).rejects.toBeInstanceOf(AccountDataAbortedError);
      await expect(
        router.readBatch("counter", [descriptor], { signal: controller.signal }),
      ).rejects.toBeInstanceOf(AccountDataAbortedError);
    });

    it("lets one caller stop waiting without cancelling the read others wait on", async () => {
      const { source, counter, release } = singleSource();
      const router = createAccountDataRouter([source]);
      const controller = new AbortController();
      const leaving = router.read("counter", descriptorOf(0), { signal: controller.signal });
      const staying = router.read("counter", descriptorOf(1));
      await settle();
      controller.abort();
      await expect(leaving).rejects.toBeInstanceOf(AccountDataAbortedError);
      release();
      await expect(staying).resolves.toEqual({ data: 1, sourceId: "single" });
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("drops the reads still waiting for a slot", async () => {
      const { source, counter, release } = singleSource("single", { concurrency: 1 });
      const router = createAccountDataRouter([source]);
      const controller = new AbortController();
      const reading = router.readBatch("counter", descriptors(3), { signal: controller.signal });
      await settle();
      controller.abort();
      release();
      const answers = await reading;
      expect(counter).toHaveBeenCalledTimes(1);
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "rejected"]);
    });
  });
});
