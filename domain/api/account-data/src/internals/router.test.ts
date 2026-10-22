import { NoAccountDataSourceError } from "../errors";
import type { AccountDataSource, AccountTarget } from "../source";
import { descriptorOf, indexOf, sourceIdOf } from "../testing";
import {
  answersInReadOrder,
  checkBatchAnswer,
  coalesce,
  coalescingKey,
  collectTargets,
  createRouterContext,
  groupBySource,
  limiterOf,
  pickSource,
  readEachTarget,
  readFromSource,
  readInChunks,
  rejected,
  withSourceId,
  type Settled,
} from "./router";
import type { Limiter } from "./limiter";

const run: Limiter = task => task();

const targetOf = (index: number, network?: string): AccountTarget => {
  const { targets } = collectTargets([{ descriptor: descriptorOf(index, network) }]);
  const [target] = targets.values();
  return target;
};

const source = (id: string, over: Partial<AccountDataSource> = {}): AccountDataSource => ({
  id: sourceIdOf(id),
  supports: () => true,
  read: { counter: async target => indexOf(target) },
  ...over,
});

const fulfilled = <T>(value: T): Settled<T> => ({ status: "fulfilled", value });

describe("createRouterContext", () => {
  it("refuses two sources sharing an id", () => {
    expect(() => createRouterContext([source("s"), source("s")], 4)).toThrow(
      'Two account data sources share the id "s"',
    );
  });
});

describe("limiterOf", () => {
  it("makes one limiter per source, reused afterwards", () => {
    const context = createRouterContext([], 4);
    const a = source("a");
    expect(limiterOf(context, a)).toBe(limiterOf(context, a));
    expect(limiterOf(context, a)).not.toBe(limiterOf(context, source("b")));
  });

  it("caps at the source's concurrency, else the router's, never below one", async () => {
    let active = 0;
    let peak = 0;
    const task = async () => {
      peak = Math.max(peak, ++active);
      await new Promise(resolve => setTimeout(resolve, 0));
      active--;
    };
    const runAll = async (limit: Limiter) => {
      peak = 0;
      await Promise.all(Array.from({ length: 6 }, () => limit(task)));
      return peak;
    };
    const context = createRouterContext([], 3);
    expect(await runAll(limiterOf(context, source("router-default")))).toBe(3);
    expect(await runAll(limiterOf(context, source("own", { concurrency: 2 })))).toBe(2);
    expect(await runAll(limiterOf(context, source("floored", { concurrency: 0 })))).toBe(1);
  });
});

describe("readEachTarget", () => {
  it("calls the reader once per target, each settling on its own", async () => {
    const read = jest.fn(async (target: AccountTarget) => {
      if (indexOf(target) === 1) throw new Error("down");
      return indexOf(target);
    });
    const answers = await Promise.all(
      readEachTarget(run, read, [targetOf(0), targetOf(1)], undefined),
    );
    expect(read).toHaveBeenCalledTimes(2);
    expect(answers.map(answer => answer.status)).toEqual(["fulfilled", "rejected"]);
  });
});

describe("checkBatchAnswer", () => {
  it("passes one answer per target, and throws naming the source otherwise", () => {
    const answers = [fulfilled(1)];
    expect(checkBatchAnswer(sourceIdOf("s"), [targetOf(0)], answers)).toBe(answers);
    expect(() => checkBatchAnswer(sourceIdOf("s"), [targetOf(0), targetOf(1)], answers)).toThrow(
      'Source "s" answered 1 results for 2 accounts',
    );
  });
});

describe("readInChunks", () => {
  it("calls once per chunk of maxBatchSize, and fails only the chunk whose call failed", async () => {
    const read = jest.fn(async (targets: readonly AccountTarget[]) => {
      if (targets.some(target => indexOf(target) === 2)) throw new Error("timeout");
      return targets.map(target => fulfilled(indexOf(target)));
    });
    const batching = source("b", { maxBatchSize: 2 });
    const targets = [0, 1, 2, 3].map(index => targetOf(index));
    const answers = await Promise.all(readInChunks(run, batching, read, targets, undefined));
    expect(read.mock.calls.map(([part]) => part.length)).toEqual([2, 2]);
    expect(answers.map(answer => answer.status)).toEqual([
      "fulfilled",
      "fulfilled",
      "rejected",
      "rejected",
    ]);
  });
});

describe("readFromSource", () => {
  it("prefers the batch reader, else the single reader, else fails every target", async () => {
    const context = createRouterContext([], 4);
    const batch = jest.fn(async (targets: readonly AccountTarget[]) =>
      targets.map(() => fulfilled(9)),
    );
    const single = jest.fn(async () => 1);
    const both = source("both", { read: { counter: single }, readBatch: { counter: batch } });
    await Promise.all(readFromSource(context, both, "counter", [targetOf(0)], undefined));
    expect(batch).toHaveBeenCalledTimes(1);
    expect(single).not.toHaveBeenCalled();

    const none = source("none", { read: {} });
    const [answer] = await Promise.all(
      readFromSource(context, none, "counter", [targetOf(0)], undefined),
    );
    expect(answer.status === "rejected" && String(answer.reason)).toMatch(
      /has no reader for counter/,
    );
  });
});

describe("collectTargets", () => {
  it("keeps one target per account and cursor, telling an empty cursor from none", () => {
    const descriptor = descriptorOf(0);
    const { slots, targets } = collectTargets([
      { descriptor },
      { descriptor },
      { descriptor, cursor: "" },
    ]);
    expect(targets.size).toBe(2);
    expect(slots[0]).toEqual(slots[1]);
    expect(slots[2]).not.toEqual(slots[0]);
  });

  it("gives a read whose descriptor throws its own failure slot", () => {
    const broken = {
      ...descriptorOf(0),
      get path(): string {
        throw new Error("unreadable descriptor");
      },
    };
    const { slots, targets } = collectTargets([
      { descriptor: broken },
      { descriptor: descriptorOf(1) },
    ]);
    expect("failure" in slots[0]).toBe(true);
    expect(targets.size).toBe(1);
  });
});

describe("pickSource", () => {
  it("takes the first ranked source that has a reader for the kind and supports the account", () => {
    const feedOnly = source("feed-only", { read: { feed: async () => ({ items: [] }) } });
    const refusing = source("refusing", { supports: () => false });
    const serving = source("serving");
    const context = createRouterContext([feedOnly, refusing, serving], 4);
    expect(pickSource(context, "counter", targetOf(0), undefined)).toBe(serving);
  });

  it("only takes the pinned source, even below a higher-ranked one", () => {
    const first = source("first");
    const second = source("second");
    const context = createRouterContext([first, second], 4);
    expect(pickSource(context, "counter", targetOf(0), sourceIdOf("second"))).toBe(second);
    expect(pickSource(context, "counter", targetOf(0), sourceIdOf("gone"))).toBeUndefined();
  });

  it("does not ask a source without a reader for the kind", () => {
    const supports = jest.fn(() => true);
    const context = createRouterContext([source("feed-only", { supports, read: {} })], 4);
    pickSource(context, "counter", targetOf(0), undefined);
    expect(supports).not.toHaveBeenCalled();
  });
});

describe("groupBySource", () => {
  it("groups the targets by source, failing alone a target no source serves or whose supports threw", async () => {
    const evm = source("evm", {
      supports: descriptor => {
        if (descriptor.network === "solana") throw new Error("unknown network");
        return descriptor.network === "ethereum";
      },
    });
    const context = createRouterContext([evm], 4);
    const { targets } = collectTargets(
      [descriptorOf(0), descriptorOf(1, "bitcoin"), descriptorOf(2, "solana")].map(descriptor => ({
        descriptor,
      })),
    );
    const { groups, answers } = groupBySource(context, "counter", targets, undefined);
    expect(groups.get(evm)?.map(({ target }) => indexOf(target))).toEqual([0]);
    const failures = await Promise.all(answers.values());
    expect(failures.map(failure => failure.status === "rejected" && failure.reason)).toEqual([
      expect.any(NoAccountDataSourceError),
      new Error("unknown network"),
    ]);
  });
});

describe("withSourceId", () => {
  it("tags a fulfilled answer with its source, and passes a rejection through", async () => {
    expect(await withSourceId(Promise.resolve(fulfilled(1)), sourceIdOf("s"))).toEqual({
      status: "fulfilled",
      value: { data: 1, sourceId: "s" },
    });
    expect(await withSourceId(rejected<number>(new Error("down")), sourceIdOf("s"))).toEqual({
      status: "rejected",
      reason: new Error("down"),
    });
  });
});

describe("answersInReadOrder", () => {
  it("gives duplicates their target's answer, and a failure slot its own rejection", async () => {
    const answer = Promise.resolve(fulfilled(1));
    const answers = answersInReadOrder(
      [{ key: "a" }, { failure: new Error("bad descriptor") }, { key: "a" }],
      new Map([["a", answer]]),
    );
    expect(answers[0]).toBe(answer);
    expect(answers[2]).toBe(answer);
    expect(await answers[1]).toEqual({ status: "rejected", reason: new Error("bad descriptor") });
  });

  it("throws when a key has no answer, which routing never leaves", () => {
    expect(() => answersInReadOrder([{ key: "a" }], new Map())).toThrow(
      "No answer was recorded for a",
    );
  });
});

describe("coalescingKey", () => {
  it("ignores the query's key order, and splits on the kind and the pinned source", () => {
    const key = coalescingKey("feed", { query: { limit: 1, filter: "in" } });
    expect(coalescingKey("feed", { query: { filter: "in", limit: 1 } })).toBe(key);
    expect(
      coalescingKey("feed", { query: { limit: 1, filter: "in" }, sourceId: sourceIdOf("s") }),
    ).not.toBe(key);
    expect(coalescingKey("counter", {})).not.toBe(coalescingKey("feed", {}));
  });
});

describe("coalesce", () => {
  it("shares the reads of one tick, and starts afresh on the next", async () => {
    const context = createRouterContext([source("s")], 4);
    const first = coalesce(context, "counter", {});
    expect(coalesce(context, "counter", {})).toBe(first);
    first.reads.push({ descriptor: descriptorOf(0) });
    const answers = await Promise.all(await first.answers);
    expect(answers).toEqual([
      { status: "fulfilled", value: { data: 0, sourceId: sourceIdOf("s") } },
    ]);
    expect(coalesce(context, "counter", {})).not.toBe(first);
  });
});
