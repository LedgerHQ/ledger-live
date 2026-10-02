import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import { NoAccountSourceError } from "./errors";
import { createAccountDataRouter } from "./router";
import type { AccountDataSource } from "./source";

const refOf = (index: number, currencyId = "ethereum"): AccountRef =>
  AccountRefSchema.parse({
    accountId: `js:2:${currencyId}:0x${index}:`,
    currencyId,
    address: `0x${index}`,
    derivationMode: "",
  });

const refs = (count: number, currencyId?: string) =>
  Array.from({ length: count }, (_, index) => refOf(index, currencyId));

const indexOf = (ref: AccountRef) => Number(ref.address.slice(2));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => (resolve = r));
  return { promise, resolve };
}

/** A source with only a batch reader, recording the refs of each call. */
function batchSource(over: Partial<AccountDataSource> = {}) {
  const calls: AccountRef[][] = [];
  const source: AccountDataSource = {
    id: "batch",
    supports: () => true,
    batch: {
      counter: async batchRefs => {
        calls.push([...batchRefs]);
        return batchRefs.map(ref => ({ status: "fulfilled", value: indexOf(ref) }));
      },
    },
    ...over,
  };
  return { source, calls };
}

/** A source with only a single reader, recording how many reads run at once. */
function singleSource(id = "single", over: Partial<AccountDataSource> = {}) {
  let active = 0;
  let peak = 0;
  const gate = deferred();
  const counter = jest.fn(async (ref: AccountRef) => {
    active++;
    peak = Math.max(peak, active);
    await gate.promise;
    active--;
    return indexOf(ref);
  });
  const source: AccountDataSource = { id, supports: () => true, counter, ...over };
  return { source, counter, peak: () => peak, release: gate.resolve };
}

const settle = () => new Promise(resolve => setImmediate(resolve));

describe("createAccountDataRouter, many accounts", () => {
  describe("merging single reads", () => {
    it("merges reads issued in the same tick into one batch call", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      const answers = await Promise.all(refs(3).map(ref => router.read("counter", ref)));
      expect(calls).toHaveLength(1);
      expect(calls[0]).toHaveLength(3);
      expect(answers.map(answer => answer.data)).toEqual([0, 1, 2]);
    });

    it("keeps reads from separate ticks apart", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      await router.read("counter", refOf(0));
      await router.read("counter", refOf(1));
      expect(calls).toHaveLength(2);
    });

    it("does not merge reads asking different questions", async () => {
      const batch = jest.fn(async (batchRefs: readonly AccountRef[]) =>
        batchRefs.map(() => ({ status: "fulfilled" as const, value: { items: [] } })),
      );
      const router = createAccountDataRouter([
        { id: "s", supports: () => true, batch: { feed: batch } },
      ]);
      await Promise.all([
        router.read("feed", refOf(0), { limit: 10 }),
        router.read("feed", refOf(1), { limit: 20 }),
        router.read("feed", refOf(2), { limit: 10 }),
      ]);
      expect(batch.mock.calls.map(([batchRefs]) => batchRefs.length).sort()).toEqual([1, 2]);
    });

    it("merges queries that only differ in key order", async () => {
      const batch = jest.fn(async (batchRefs: readonly AccountRef[]) =>
        batchRefs.map(() => ({ status: "fulfilled" as const, value: { items: [] } })),
      );
      const router = createAccountDataRouter([
        { id: "s", supports: () => true, batch: { feed: batch } },
      ]);
      await Promise.all([
        router.read("feed", refOf(0), { limit: 10, cursor: "c" }),
        router.read("feed", refOf(1), { cursor: "c", limit: 10 }),
      ]);
      expect(batch).toHaveBeenCalledTimes(1);
    });

    it("reads a ref asked twice once, and answers both callers", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source]);
      const [first, second] = await Promise.all([
        router.read("counter", refOf(4)),
        router.read("counter", refOf(4)),
      ]);
      expect(calls).toEqual([[refOf(4)]]);
      expect(first.data).toBe(4);
      expect(second.data).toBe(4);
    });

    it("lets one caller give up without cancelling the read others wait on", async () => {
      const { source, counter, release } = singleSource();
      const router = createAccountDataRouter([source]);
      const controller = new AbortController();
      const leaving = router.read("counter", refOf(0), undefined, { signal: controller.signal });
      const staying = router.read("counter", refOf(1));
      await settle();
      controller.abort();
      await expect(leaving).rejects.toThrow(/aborted/);
      release();
      await expect(staying).resolves.toEqual({ data: 1, sourceId: "single" });
      expect(counter).toHaveBeenCalledTimes(2);
    });

    it("reads each call on its own when merging is off", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source], { coalesce: false });
      await Promise.all(refs(3).map(ref => router.read("counter", ref)));
      expect(calls).toHaveLength(3);
    });
  });

  describe("readBatch", () => {
    it("answers in the order asked, with the source that answered each", async () => {
      const { source } = batchSource();
      const router = createAccountDataRouter([source]);
      expect(await router.readBatch("counter", [refOf(2), refOf(0)])).toEqual([
        { status: "fulfilled", value: { data: 2, sourceId: "batch" } },
        { status: "fulfilled", value: { data: 0, sourceId: "batch" } },
      ]);
    });

    it("splits a batch larger than the source takes", async () => {
      const { source, calls } = batchSource({ maxBatchSize: 2 });
      const router = createAccountDataRouter([source]);
      await router.readBatch("counter", refs(5));
      expect(calls.map(call => call.length)).toEqual([2, 2, 1]);
    });

    it("splits the accounts between the sources first for each, keeping the rank", async () => {
      const { source: batch, calls } = batchSource({
        id: "evm",
        supports: ref => ref.currencyId === "ethereum",
      });
      const fallback = singleSource("fallback");
      fallback.release();
      const router = createAccountDataRouter([batch, fallback.source]);
      const answers = await router.readBatch("counter", [refOf(0), refOf(1, "bitcoin"), refOf(2)]);
      expect(calls).toEqual([[refOf(0), refOf(2)]]);
      expect(fallback.counter).toHaveBeenCalledTimes(1);
      expect(answers.map(answer => answer.status === "fulfilled" && answer.value.sourceId)).toEqual(
        ["evm", "fallback", "evm"],
      );
    });

    it("never prefers a lower-ranked source because it can batch", async () => {
      const single = singleSource("first");
      single.release();
      const { source: batch, calls } = batchSource({ id: "second" });
      const router = createAccountDataRouter([single.source, batch]);
      await router.readBatch("counter", refs(3));
      expect(single.counter).toHaveBeenCalledTimes(3);
      expect(calls).toHaveLength(0);
    });

    it("rejects only the accounts no source can answer", async () => {
      const { source } = batchSource({ supports: ref => ref.currencyId === "ethereum" });
      const router = createAccountDataRouter([source]);
      const [served, orphan] = await router.readBatch("counter", [refOf(0), refOf(1, "bitcoin")]);
      expect(served.status).toBe("fulfilled");
      expect(orphan.status === "rejected" && orphan.reason).toBeInstanceOf(NoAccountSourceError);
    });
  });

  describe("simulating a batch with single reads", () => {
    it("never runs more than the source's concurrency at once", async () => {
      const { source, counter, peak, release } = singleSource("single", { concurrency: 2 });
      const router = createAccountDataRouter([source]);
      const reading = router.readBatch("counter", refs(6));
      await settle();
      expect(peak()).toBe(2);
      release();
      const answers = await reading;
      expect(counter).toHaveBeenCalledTimes(6);
      expect(answers.every(answer => answer.status === "fulfilled")).toBe(true);
    });

    it("caps each source at the router's default of 4, across separate calls", async () => {
      const { source, peak, release } = singleSource();
      const router = createAccountDataRouter([source]);
      const both = Promise.all([
        router.readBatch("counter", refs(5)),
        router.readBatch("counter", refs(5, "bitcoin")),
      ]);
      await settle();
      expect(peak()).toBe(4);
      release();
      await both;
    });

    it("drops the reads still waiting for a slot once the caller aborts", async () => {
      const { source, counter, release } = singleSource("single", { concurrency: 1 });
      const router = createAccountDataRouter([source]);
      const controller = new AbortController();
      const reading = router.readBatch("counter", refs(3), undefined, {
        signal: controller.signal,
      });
      await settle();
      controller.abort();
      release();
      const answers = await reading;
      expect(counter).toHaveBeenCalledTimes(1);
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "rejected"]);
    });

    it("lets one account fail without failing the others", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          counter: async ref => {
            if (indexOf(ref) === 1) throw new Error("explorer down");
            return indexOf(ref);
          },
        },
      ]);
      const answers = await router.readBatch("counter", refs(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });
  });

  describe("a batch reader", () => {
    it("answers a single read on a source that only batches", async () => {
      const { source, calls } = batchSource();
      const router = createAccountDataRouter([source], { coalesce: false });
      expect(await router.read("counter", refOf(3))).toEqual({ data: 3, sourceId: "batch" });
      expect(calls).toEqual([[refOf(3)]]);
    });

    it("keeps one account's failure to that account", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          batch: {
            counter: async batchRefs =>
              batchRefs.map(ref =>
                indexOf(ref) === 1
                  ? { status: "rejected", reason: new Error("unknown address") }
                  : { status: "fulfilled", value: indexOf(ref) },
              ),
          },
        },
      ]);
      const answers = await router.readBatch("counter", refs(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });

    it("fails only the chunk whose call rejected, without retrying it account by account", async () => {
      const batch = jest.fn(async (batchRefs: readonly AccountRef[]) => {
        if (batchRefs.some(ref => indexOf(ref) === 2)) throw new Error("timeout");
        return batchRefs.map(ref => ({ status: "fulfilled" as const, value: indexOf(ref) }));
      });
      const router = createAccountDataRouter([
        { id: "s", supports: () => true, maxBatchSize: 2, batch: { counter: batch } },
      ]);
      const answers = await router.readBatch("counter", refs(4));
      expect(answers.map(answer => answer.status)).toEqual([
        "fulfilled",
        "fulfilled",
        "rejected",
        "rejected",
      ]);
      expect(batch).toHaveBeenCalledTimes(2);
    });

    it("fails the chunk when the source answers the wrong number of results", async () => {
      const router = createAccountDataRouter([
        {
          id: "s",
          supports: () => true,
          batch: { counter: async () => [{ status: "fulfilled", value: 1 }] },
        },
      ]);
      const answers = await router.readBatch("counter", refs(2));
      expect(answers.every(answer => answer.status === "rejected")).toBe(true);
      expect(answers[0].status === "rejected" && String(answers[0].reason)).toMatch(
        /answered 1 results for 2 accounts/,
      );
    });

    it("is called with the source as `this`", async () => {
      class PortfolioSource implements AccountDataSource {
        readonly id = "portfolio";
        private readonly offset = 100;
        supports() {
          return true;
        }
        readonly batch: AccountDataSource["batch"] = {
          counter: async batchRefs =>
            batchRefs.map(ref => ({ status: "fulfilled", value: indexOf(ref) + this.offset })),
        };
      }
      const router = createAccountDataRouter([new PortfolioSource()]);
      expect((await router.read("counter", refOf(1))).data).toBe(101);
    });
  });
});
