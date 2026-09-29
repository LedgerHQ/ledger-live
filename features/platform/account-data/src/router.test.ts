import { createAccountDataRouter, NoAccountDataSourceError, type AccountDataSource } from ".";
import type { AccountRef } from "./source";

const ref = {
  accountId: "js:2:bitcoin:xpub:native_segwit",
  currencyId: "bitcoin",
  address: "addr",
  derivationMode: "native_segwit",
} as unknown as AccountRef;

const source = (id: string, supports: boolean, methods: Partial<AccountDataSource> = {}) =>
  ({ id, supports: () => supports, ...methods }) as AccountDataSource;

describe("createAccountDataRouter", () => {
  it("picks the first source that supports the account and implements the method", () => {
    const first = source("first", true, { getBalances: async () => [] });
    const second = source("second", true, { getBalances: async () => [] });
    expect(createAccountDataRouter([first, second]).resolve("getBalances", ref)).toBe(first);
  });

  it("falls back to the next source when the method is not implemented", () => {
    const balanceOnly = source("balance-only", true, { getBalances: async () => [] });
    const full = source("full", true, { getBalances: async () => [], getOperations: jest.fn() });
    expect(createAccountDataRouter([balanceOnly, full]).resolve("getOperations", ref)).toBe(full);
  });

  it("skips sources that do not support the account", () => {
    const other = source("other", false, { getBalances: async () => [] });
    const mine = source("mine", true, { getBalances: async () => [] });
    expect(createAccountDataRouter([other, mine]).resolve("getBalances", ref)).toBe(mine);
  });

  it("throws when nothing matches", () => {
    expect(() =>
      createAccountDataRouter([source("none", false)]).resolve("getBalances", ref),
    ).toThrow(NoAccountDataSourceError);
  });
});
