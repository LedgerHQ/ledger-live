import type { AccountRef } from "@domain/entity-account";
import { ref } from "./testing/toyData";
import { NoAccountSourceError } from "./errors";
import { createAccountDataRouter } from "./router";
import type { AccountDataSource } from "./source";

describe("createAccountDataRouter", () => {
  it("asks the first source that has the method and supports the ref", async () => {
    const router = createAccountDataRouter([
      { id: "a", supports: () => false, counter: async () => 1 },
      { id: "b", supports: () => true, counter: async () => 2 },
      { id: "c", supports: () => true, counter: async () => 3 },
    ]);
    expect(await router.read("counter", ref)).toEqual({ data: 2, sourceId: "b" });
  });

  it("skips a source that does not implement the datum, without asking it", async () => {
    const supports = jest.fn(() => true);
    const router = createAccountDataRouter([
      { id: "feed-only", supports, feed: async () => ({ items: [] }) },
      { id: "full", supports: () => true, counter: async () => 1 },
    ]);
    expect((await router.read("counter", ref)).sourceId).toBe("full");
    expect(supports).not.toHaveBeenCalled();
  });

  it("lets a source support one datum and not another for the same account", async () => {
    const granular: AccountDataSource = {
      id: "granular",
      supports: (_ref, datum) => datum === "counter",
      counter: async () => 1,
      feed: async () => ({ items: ["granular"] }),
    };
    const fallback: AccountDataSource = {
      id: "fallback",
      supports: () => true,
      feed: async () => ({ items: ["fallback"] }),
    };
    const router = createAccountDataRouter([granular, fallback]);
    expect((await router.read("counter", ref)).sourceId).toBe("granular");
    expect((await router.read("feed", ref)).sourceId).toBe("fallback");
  });

  it("throws NoAccountSourceError when nobody can answer", async () => {
    const router = createAccountDataRouter([{ id: "a", supports: () => false }]);
    await expect(router.read("counter", ref)).rejects.toBeInstanceOf(NoAccountSourceError);
  });

  it("only asks the pinned source, even if a higher-ranked one could answer", async () => {
    const router = createAccountDataRouter([
      { id: "first", supports: () => true, counter: async () => 1 },
      { id: "second", supports: () => true, counter: async () => 2 },
    ]);
    expect(await router.read("counter", ref, undefined, { sourceId: "second" })).toEqual({
      data: 2,
      sourceId: "second",
    });
    await expect(
      router.read("counter", ref, undefined, { sourceId: "gone" }),
    ).rejects.toBeInstanceOf(NoAccountSourceError);
  });

  it("passes the query and signal through when not merging, and keeps a class source's `this`", async () => {
    class PagedSource implements AccountDataSource {
      readonly id = "paged";
      private readonly pageSize = 25;
      supports() {
        return true;
      }
      async feed(_ref: AccountRef, query: { cursor?: string } | undefined, signal?: AbortSignal) {
        return { items: [], nextCursor: `${query?.cursor}:${this.pageSize}:${signal?.aborted}` };
      }
    }
    const router = createAccountDataRouter([new PagedSource()], { coalesce: false });
    const { data } = await router.read(
      "feed",
      ref,
      { cursor: "c1" },
      {
        signal: new AbortController().signal,
      },
    );
    expect(data.nextCursor).toBe("c1:25:false");
  });
});
