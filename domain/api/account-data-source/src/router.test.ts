import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import type { AccountBalance } from "@domain/entity-account-balance";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { NoAccountSourceError } from "./errors";
import { createAccountDataRouter } from "./router";
import type { AccountDataSource } from "./source";

const ref: AccountRef = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

const rows = (balance: string): AccountBalance[] => [
  mockAccountBalance({ balance: balance as AccountBalance["balance"] }),
];

describe("createAccountDataRouter", () => {
  it("asks the first source that has the method and supports the ref", async () => {
    const router = createAccountDataRouter([
      { id: "a", supports: () => false, balance: async () => rows("1") },
      { id: "b", supports: () => true, balance: async () => rows("2") },
      { id: "c", supports: () => true, balance: async () => rows("3") },
    ]);
    const { data, sourceId } = await router.read("balance", ref);
    expect(sourceId).toBe("b");
    expect(data[0].balance).toBe("2");
  });

  it("skips a source that does not implement the datum, without asking it", async () => {
    const supports = jest.fn(() => true);
    const router = createAccountDataRouter([
      {
        id: "operations-only",
        supports,
        operations: async () => ({ operations: [], complete: true }),
      },
      { id: "full", supports: () => true, balance: async () => rows("1") },
    ]);
    expect((await router.read("balance", ref)).sourceId).toBe("full");
    expect(supports).not.toHaveBeenCalled();
  });

  it("lets a source support one datum and not another for the same account", async () => {
    const granular: AccountDataSource = {
      id: "granular",
      supports: (_ref, datum) => datum === "balance",
      balance: async () => rows("1"),
      operations: async () => ({ operations: [], complete: false, nextCursor: "c1" }),
    };
    const legacy: AccountDataSource = {
      id: "full-sync",
      supports: () => true,
      operations: async () => ({ operations: [], complete: true }),
    };
    const router = createAccountDataRouter([granular, legacy]);
    expect((await router.read("balance", ref)).sourceId).toBe("granular");
    expect((await router.read("operations", ref)).sourceId).toBe("full-sync");
  });

  it("throws NoAccountSourceError when nobody can answer", async () => {
    const router = createAccountDataRouter([{ id: "a", supports: () => false }]);
    await expect(router.read("balance", ref)).rejects.toBeInstanceOf(NoAccountSourceError);
  });

  it("only asks the pinned source, even if a higher-ranked one could answer", async () => {
    const router = createAccountDataRouter([
      { id: "first", supports: () => true, balance: async () => rows("1") },
      { id: "second", supports: () => true, balance: async () => rows("2") },
    ]);
    expect((await router.read("balance", ref, undefined, { sourceId: "second" })).sourceId).toBe(
      "second",
    );
    await expect(
      router.read("balance", ref, undefined, { sourceId: "gone" }),
    ).rejects.toBeInstanceOf(NoAccountSourceError);
  });

  it("passes the query and signal through, and keeps a class source's `this`", async () => {
    class PagedSource implements AccountDataSource {
      readonly id = "paged";
      private readonly pageSize = 25;
      supports() {
        return true;
      }
      async operations(
        _ref: AccountRef,
        query: { cursor?: string } | undefined,
        signal?: AbortSignal,
      ) {
        return {
          operations: [],
          complete: false,
          nextCursor: `${query?.cursor}:${this.pageSize}:${signal?.aborted}`,
        };
      }
    }
    const router = createAccountDataRouter([new PagedSource()]);
    const { data } = await router.read(
      "operations",
      ref,
      { cursor: "c1" },
      {
        signal: new AbortController().signal,
      },
    );
    expect(data.nextCursor).toBe("c1:25:false");
  });
});
