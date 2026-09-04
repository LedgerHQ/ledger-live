import { AccountIdSchema } from "@shared/schema-primitives";
import { mockAccountOperation } from "@domain/entity-account-operations/schema.mock";
import { NoAccountSourceError } from "./errors";
import { readAccountOperations, type AccountOperationsSource } from "./operations";
import { pickSource, type AccountRef } from "./source";

const ref: AccountRef = {
  accountId: AccountIdSchema.parse("js:2:ethereum:0xabc:"),
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const source = (
  id: string,
  priority: number,
  over: Partial<AccountOperationsSource> = {},
): AccountOperationsSource => ({
  id,
  priority,
  paginated: true,
  supports: () => true,
  getOperations: async () => ({
    operations: [mockAccountOperation()],
    nextCursor: "c1",
    complete: false,
  }),
  ...over,
});

describe("pickSource, over operations sources", () => {
  it("is the same selection rule, on a different kind of source", () => {
    const granular = source("granular", 10);
    const fullSync = source("full-sync", 0);
    expect(pickSource(ref, [fullSync, granular])).toBe(granular);
    expect(pickSource(ref, [source("granular", 10, { supports: () => false }), fullSync])).toBe(
      fullSync,
    );
  });
});

describe("readAccountOperations", () => {
  it("returns the page and names the source that answered", async () => {
    const page = await readAccountOperations(ref, [source("granular", 10)]);
    expect(page.sourceId).toBe("granular");
    expect(page.operations).toEqual([mockAccountOperation()]);
    expect(page.nextCursor).toBe("c1");
    expect(page.complete).toBe(false);
  });

  it("throws when nothing supports the ref", async () => {
    await expect(readAccountOperations(ref, [])).rejects.toThrow(NoAccountSourceError);
    await expect(readAccountOperations(ref, [])).rejects.toThrow(
      "No account operations source supports",
    );
  });

  it("passes the query and the abort signal down", async () => {
    const seen: unknown[] = [];
    const controller = new AbortController();
    await readAccountOperations(
      ref,
      [
        source("granular", 10, {
          getOperations: async (_ref, query, signal) => {
            seen.push({ query, signal });
            return { operations: [], complete: true };
          },
        }),
      ],
      { cursor: "c1", limit: 25 },
      controller.signal,
    );
    expect(seen).toEqual([{ query: { cursor: "c1", limit: 25 }, signal: controller.signal }]);
  });

  it("drops the cursor for a source that cannot resume from one", async () => {
    // The cursor belongs to whoever issued it. Handing a full-sync source a granular source's cursor
    // would at best be rejected and at worst resume somewhere else in the history.
    const seen: unknown[] = [];
    await readAccountOperations(
      ref,
      [
        source("full-sync", 0, {
          paginated: false,
          getOperations: async (_ref, query) => {
            seen.push(query.cursor);
            return { operations: [], complete: true };
          },
        }),
      ],
      { cursor: "c1", limit: 25 },
    );
    expect(seen).toEqual([undefined]);
  });
});
