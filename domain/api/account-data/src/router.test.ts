import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { NoAccountDataSourceError } from "./errors";
import {
  createAccountDataRouter,
  type AccountDataReadOptions,
  type AccountDataRouter,
} from "./router";
import type { AccountDataSource, AccountTarget } from "./source";
import { accountUUID, descriptor, descriptorOf, indexOf, sourceIdOf } from "./testing";

const descriptors = (count: number, network?: string) =>
  Array.from({ length: count }, (_, index) => descriptorOf(index, network));

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

/** Reads every account in the same tick, as many screens mounting together would. */
const readAll = (
  router: AccountDataRouter,
  descriptors: readonly AccountDescriptor[],
  options?: AccountDataReadOptions<"counter">,
) => Promise.allSettled(descriptors.map(each => router.read("counter", each, options)));

function gate() {
  let open: () => void = () => undefined;
  const opened = new Promise<void>(resolve => (open = resolve));
  return { opened, open };
}

/** A source with only a batch reader, recording the descriptors of each call. */
function batchSource(over: Partial<AccountDataSource> = {}) {
  const calls: AccountDescriptor[][] = [];
  const source: AccountDataSource = {
    id: sourceIdOf("batch"),
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
  const source: AccountDataSource = {
    id: sourceIdOf(id),
    supports: () => true,
    read: { counter },
    ...over,
  };
  return { source, counter, peak: () => peak, release: open };
}

describe("createAccountDataRouter", () => {
  describe("ranking", () => {
    it("asks the first source that has a reader and supports the account", async () => {
      const router = createAccountDataRouter([
        { id: sourceIdOf("a"), supports: () => false, read: { counter: async () => 1 } },
        { id: sourceIdOf("b"), supports: () => true, read: { counter: async () => 2 } },
        { id: sourceIdOf("c"), supports: () => true, read: { counter: async () => 3 } },
      ]);
      expect(await router.read("counter", descriptor)).toEqual({
        data: 2,
        sourceId: sourceIdOf("b"),
      });
    });

    it("skips a source without a reader for the kind, without asking it", async () => {
      const supports = jest.fn(() => true);
      const router = createAccountDataRouter([
        { id: sourceIdOf("feed-only"), supports, read: { feed: async () => ({ items: [] }) } },
        { id: sourceIdOf("full"), supports: () => true, read: { counter: async () => 1 } },
      ]);
      expect((await router.read("counter", descriptor)).sourceId).toBe(sourceIdOf("full"));
      expect(supports).not.toHaveBeenCalled();
    });

    it("lets a source support one kind and not another for the same account", async () => {
      const router = createAccountDataRouter([
        {
          id: sourceIdOf("granular"),
          supports: (_descriptor, kind) => kind === "counter",
          read: { counter: async () => 1, feed: async () => ({ items: ["granular"] }) },
        },
        {
          id: sourceIdOf("fallback"),
          supports: () => true,
          read: { feed: async () => ({ items: [] }) },
        },
      ]);
      expect((await router.read("counter", descriptor)).sourceId).toBe(sourceIdOf("granular"));
      expect((await router.read("feed", descriptor)).sourceId).toBe(sourceIdOf("fallback"));
    });

    it("hands the reader the account UUID, the descriptor and the query", async () => {
      const feed = jest.fn(async () => ({ items: [] }));
      const router = createAccountDataRouter([
        { id: sourceIdOf("a"), supports: () => true, read: { feed } },
      ]);
      await router.read("feed", descriptor, { query: { limit: 10 } });
      expect(feed).toHaveBeenCalledWith({ accountUUID, descriptor }, { limit: 10 });
    });

    it("rejects with NoAccountDataSourceError when no source can answer", async () => {
      const router = createAccountDataRouter([{ id: sourceIdOf("a"), supports: () => false }]);
      await expect(router.read("counter", descriptor)).rejects.toBeInstanceOf(
        NoAccountDataSourceError,
      );
    });

    it("never prefers a lower-ranked source because it can batch", async () => {
      const single = singleSource("first");
      single.release();
      const { source: batch, calls } = batchSource({ id: sourceIdOf("second") });
      const router = createAccountDataRouter([single.source, batch]);
      await readAll(router, descriptors(3));
      expect(single.counter).toHaveBeenCalledTimes(3);
      expect(calls).toHaveLength(0);
    });

    it("splits the accounts between the sources first for each", async () => {
      const { source: evm, calls } = batchSource({
        id: sourceIdOf("evm"),
        supports: account => account.network === "ethereum",
      });
      const fallback = singleSource("fallback");
      fallback.release();
      const router = createAccountDataRouter([evm, fallback.source]);
      const answers = await readAll(router, [
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

    it("fails only the account whose routing threw, not the reads of its tick", async () => {
      const { source } = batchSource({
        supports: account => {
          if (account.network === "bitcoin") throw new Error("unknown network");
          return true;
        },
      });
      const router = createAccountDataRouter([source]);
      const [served, broken] = await readAll(router, [descriptorOf(0), descriptorOf(1, "bitcoin")]);
      expect(served.status).toBe("fulfilled");
      expect(broken.status === "rejected" && String(broken.reason)).toMatch(/unknown network/);
    });

    it("rejects only the accounts no source can answer", async () => {
      const { source } = batchSource({ supports: account => account.network === "ethereum" });
      const router = createAccountDataRouter([source]);
      const [served, orphan] = await readAll(router, [descriptorOf(0), descriptorOf(1, "bitcoin")]);
      expect(served.status).toBe("fulfilled");
      expect(orphan.status === "rejected" && orphan.reason).toBeInstanceOf(
        NoAccountDataSourceError,
      );
    });
  });

  describe("pagination affinity", () => {
    it("only asks the pinned source, even when a higher-ranked one could answer", async () => {
      const router = createAccountDataRouter([
        { id: sourceIdOf("first"), supports: () => true, read: { counter: async () => 1 } },
        { id: sourceIdOf("second"), supports: () => true, read: { counter: async () => 2 } },
      ]);
      expect(await router.read("counter", descriptor, { sourceId: sourceIdOf("second") })).toEqual({
        data: 2,
        sourceId: sourceIdOf("second"),
      });
    });

    it("fails rather than falling back when the pinned source no longer serves the account", async () => {
      const router = createAccountDataRouter([
        { id: sourceIdOf("first"), supports: () => true, read: { counter: async () => 1 } },
        { id: sourceIdOf("gone"), supports: () => false, read: { counter: async () => 2 } },
      ]);
      await expect(
        router.read("counter", descriptor, { sourceId: sourceIdOf("gone") }),
      ).rejects.toBeInstanceOf(NoAccountDataSourceError);
    });
  });

  describe("coalescing single reads", () => {
    it("answers each caller as soon as its own source answers", async () => {
      const slow = singleSource("slow", {
        supports: account => account.network === "bitcoin",
      });
      const router = createAccountDataRouter([
        slow.source,
        { id: sourceIdOf("fast"), supports: () => true, read: { counter: async () => 1 } },
      ]);
      const fast = router.read("counter", descriptorOf(0));
      const blocked = router.read("counter", descriptorOf(1, "bitcoin"));
      await expect(fast).resolves.toEqual({ data: 1, sourceId: sourceIdOf("fast") });
      slow.release();
      await expect(blocked).resolves.toEqual({ data: 1, sourceId: sourceIdOf("slow") });
    });

    it("answers the accounts of one chunk without waiting for the other chunks", async () => {
      const { opened, open } = gate();
      const router = createAccountDataRouter([
        {
          id: sourceIdOf("s"),
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
      await expect(first).resolves.toEqual({ data: 0, sourceId: sourceIdOf("s") });
      open();
      await expect(second).resolves.toEqual({ data: 1, sourceId: sourceIdOf("s") });
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
        { id: sourceIdOf("s"), supports: () => true, readBatch: { feed } },
      ]);
      await Promise.all([
        router.read("feed", descriptorOf(0), { query: { limit: 10, filter: "in" } }),
        router.read("feed", descriptorOf(1), { query: { limit: 20 } }),
        router.read("feed", descriptorOf(2), { query: { filter: "in", limit: 10 } }),
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
      expect(await router.read("counter", descriptorOf(3))).toEqual({
        data: 3,
        sourceId: sourceIdOf("batch"),
      });
      expect(calls).toEqual([[descriptorOf(3)]]);
    });
  });

  describe("without a batch reader", () => {
    it("calls the single reader once per account, at most the source's concurrency at once", async () => {
      const { source, counter, peak, release } = singleSource("single", { concurrency: 2 });
      const router = createAccountDataRouter([source]);
      const reading = readAll(router, descriptors(6));
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
        readAll(router, descriptors(5)),
        readAll(router, descriptors(5, "bitcoin")),
      ]);
      await settle();
      expect(peak()).toBe(4);
      release();
      await both;
    });

    it("lets one account fail without failing the others", async () => {
      const router = createAccountDataRouter([
        {
          id: sourceIdOf("s"),
          supports: () => true,
          read: {
            counter: async target => {
              if (indexOf(target) === 1) throw new Error("explorer down");
              return indexOf(target);
            },
          },
        },
      ]);
      const answers = await readAll(router, descriptors(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });
  });

  describe("with a batch reader", () => {
    it("answers in the order asked", async () => {
      const { source } = batchSource();
      const router = createAccountDataRouter([source]);
      expect(await readAll(router, [descriptorOf(2), descriptorOf(0)])).toEqual([
        { status: "fulfilled", value: { data: 2, sourceId: sourceIdOf("batch") } },
        { status: "fulfilled", value: { data: 0, sourceId: sourceIdOf("batch") } },
      ]);
    });

    it("splits a batch larger than maxBatchSize", async () => {
      const { source, calls } = batchSource({ maxBatchSize: 2 });
      const router = createAccountDataRouter([source]);
      await readAll(router, descriptors(5));
      expect(calls.map(call => call.length)).toEqual([2, 2, 1]);
    });

    it("keeps one account's failure to that account", async () => {
      const router = createAccountDataRouter([
        {
          id: sourceIdOf("s"),
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
      const answers = await readAll(router, descriptors(3));
      expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected", "fulfilled"]);
    });

    it("fails only the chunk whose call rejected, without retrying it account by account", async () => {
      const counter = jest.fn(async (targets: readonly AccountTarget[]) => {
        if (targets.some(target => indexOf(target) === 2)) throw new Error("timeout");
        return targets.map(target => ({ status: "fulfilled" as const, value: indexOf(target) }));
      });
      const router = createAccountDataRouter([
        { id: sourceIdOf("s"), supports: () => true, maxBatchSize: 2, readBatch: { counter } },
      ]);
      const answers = await readAll(router, descriptors(4));
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
          id: sourceIdOf("s"),
          supports: () => true,
          readBatch: { counter: async () => [{ status: "fulfilled", value: 1 }] },
        },
      ]);
      const answers = await readAll(router, descriptors(2));
      expect(answers.every(answer => answer.status === "rejected")).toBe(true);
      expect(answers[0].status === "rejected" && String(answers[0].reason)).toMatch(
        /answered 1 results for 2 accounts/,
      );
    });
  });

  describe("next pages", () => {
    it("hands each target its own cursor, in one batch call", async () => {
      const feed = jest.fn(async (targets: readonly AccountTarget[]) =>
        targets.map(target => ({
          status: "fulfilled" as const,
          value: { items: [target.cursor ?? "head"] },
        })),
      );
      const router = createAccountDataRouter([
        { id: sourceIdOf("s"), supports: () => true, readBatch: { feed } },
      ]);
      const answers = await Promise.all([
        router.read("feed", descriptorOf(0), { sourceId: sourceIdOf("s"), cursor: "a" }),
        router.read("feed", descriptorOf(1), { sourceId: sourceIdOf("s"), cursor: "b" }),
      ]);
      expect(feed).toHaveBeenCalledTimes(1);
      expect(answers.map(answer => answer.data.items)).toEqual([["a"], ["b"]]);
    });

    it("tells an empty cursor from no cursor", async () => {
      const feed = jest.fn(async (target: AccountTarget) => ({
        items: [target.cursor === undefined ? "head" : `after:${target.cursor}`],
      }));
      const router = createAccountDataRouter([
        { id: sourceIdOf("s"), supports: () => true, read: { feed } },
      ]);
      const [head, next] = await Promise.all([
        router.read("feed", descriptor),
        router.read("feed", descriptor, { cursor: "" }),
      ]);
      expect(head.data.items).toEqual(["head"]);
      expect(next.data.items).toEqual(["after:"]);
    });

    it("reads two pages of one account asked in the same tick apart", async () => {
      const feed = jest.fn(async (target: AccountTarget) => ({ items: [target.cursor ?? "head"] }));
      const router = createAccountDataRouter([
        { id: sourceIdOf("s"), supports: () => true, read: { feed } },
      ]);
      const [head, next] = await Promise.all([
        router.read("feed", descriptor),
        router.read("feed", descriptor, { cursor: "c1" }),
      ]);
      expect(head.data.items).toEqual(["head"]);
      expect(next.data.items).toEqual(["c1"]);
    });
  });
});

describe("addSource", () => {
  const constant = (id: string, value: number): AccountDataSource => ({
    id: sourceIdOf(id),
    supports: () => true,
    read: { counter: async () => value },
  });

  it("serves from the next read, after the sources ranked at creation", async () => {
    const router = createAccountDataRouter([]);
    await expect(router.read("counter", descriptor)).rejects.toBeInstanceOf(
      NoAccountDataSourceError,
    );
    router.addSource(constant("late", 1));
    await expect(router.read("counter", descriptor)).resolves.toEqual({
      data: 1,
      sourceId: "late",
    });

    const ranked = createAccountDataRouter([constant("first", 0)]);
    ranked.addSource(constant("late", 1));
    await expect(ranked.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });
  });

  it("ranks a source added first ahead of the app's, until removed", async () => {
    const router = createAccountDataRouter([constant("app", 0)]);
    const remove = router.addSource(constant("takeover", 1), { first: true });
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 1 });
    remove();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });
  });

  it("moves a source added first ahead, even in place of one sharing its id", async () => {
    const router = createAccountDataRouter([constant("app", 0), constant("dev", 1)]);
    router.addSource(constant("dev", 2), { first: true });
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 2 });
  });

  it("puts a source replaced by one added first back at its rank once removed", async () => {
    const router = createAccountDataRouter([constant("app", 0), constant("dev", 1)]);
    const remove = router.addSource(constant("dev", 2), { first: true });
    remove();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });
  });

  it("replaces the source sharing its id, and its remover puts it back", async () => {
    const router = createAccountDataRouter([constant("dev", 0)]);
    const remove = router.addSource(constant("dev", 1));
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 1 });
    remove();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });
    remove();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });
  });

  it("ranks the latest source still registered when removers run out of order", async () => {
    const router = createAccountDataRouter([constant("dev", 0)]);
    const removeA = router.addSource(constant("dev", 1));
    const removeB = router.addSource(constant("dev", 2));
    removeA();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 2 });
    removeB();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 0 });

    const added = createAccountDataRouter([]);
    const removeC = added.addSource(constant("dev", 1));
    const removeD = added.addSource(constant("dev", 2));
    removeC();
    removeD();
    await expect(added.read("counter", descriptor)).rejects.toBeInstanceOf(
      NoAccountDataSourceError,
    );
  });

  it("removes a registration, not the latest one of the same source", async () => {
    const router = createAccountDataRouter([]);
    const a = constant("dev", 1);
    const removeFirstA = router.addSource(a);
    const removeB = router.addSource(constant("dev", 2));
    router.addSource(a);
    removeFirstA();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 1 });
    removeB();
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 1 });
  });

  it("routes a descriptor only to the sources serving its purpose, account by default", async () => {
    const router = createAccountDataRouter([{ ...constant("none", 0), purposes: [] }]);
    await expect(router.read("counter", descriptor)).rejects.toBeInstanceOf(
      NoAccountDataSourceError,
    );
    router.addSource(constant("real", 1));
    await expect(router.read("counter", descriptor)).resolves.toMatchObject({ data: 1 });
  });
});
