import type { AccountRef } from "@domain/entity-account";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { createAccountDataRouter, NoAccountSourceError, type AccountDataSource } from ".";

const ref: AccountRef = {
  accountId: mockAccountBalance().accountId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
} as AccountRef;

const source = (id: string, methods: Partial<AccountDataSource> = {}, supports = true) =>
  ({ id, supports: () => supports, ...methods }) satisfies AccountDataSource;

describe("createAccountDataRouter", () => {
  it("reads from the first source that supports the account and has the method", async () => {
    const first = source("first", { balance: async () => [] });
    const second = source("second", { balance: async () => [mockAccountBalance()] });
    const result = await createAccountDataRouter([first, second]).read("balance", ref, {});
    expect(result).toEqual({ data: [], sourceId: "first" });
  });

  it("falls back to the next source when the method is missing", async () => {
    const operationsOnly = source("ops", {
      operations: async () => ({ operations: [], complete: true }),
    });
    const full = source("full", { balance: async () => [] });
    const router = createAccountDataRouter([operationsOnly, full]);
    expect((await router.read("balance", ref, {})).sourceId).toBe("full");
  });

  it("asks supports() per datum", async () => {
    const supports = jest.fn((_ref: AccountRef, datum: string) => datum === "operations");
    const picky = { id: "picky", supports, balance: async () => [] } satisfies AccountDataSource;
    const fallback = source("fallback", { balance: async () => [] });
    const result = await createAccountDataRouter([picky, fallback]).read("balance", ref, {});
    expect(result.sourceId).toBe("fallback");
    expect(supports).toHaveBeenCalledWith(ref, "balance");
  });

  it("skips sources that do not support the account", async () => {
    const other = source("other", { balance: async () => [] }, false);
    const mine = source("mine", { balance: async () => [] });
    expect((await createAccountDataRouter([other, mine]).read("balance", ref, {})).sourceId).toBe(
      "mine",
    );
  });

  it("only asks the given source when a sourceId is passed", async () => {
    const first = source("first", { balance: async () => [] });
    const second = source("second", { balance: async () => [] });
    const router = createAccountDataRouter([first, second]);
    expect((await router.read("balance", ref, {}, { sourceId: "second" })).sourceId).toBe("second");
    await expect(router.read("balance", ref, {}, { sourceId: "missing" })).rejects.toThrow(
      NoAccountSourceError,
    );
  });

  it("throws when nothing matches", async () => {
    await expect(createAccountDataRouter([]).read("balance", ref, {})).rejects.toThrow(
      NoAccountSourceError,
    );
  });
});
