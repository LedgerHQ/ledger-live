import { AccountIdSchema } from "@shared/schema-primitives";
import { mockAccountBalance } from "@domain/entity-account-balance/schema.mock";
import { NoAccountSourceError } from "./errors";
import {
  pickSource,
  readAccountBalances,
  type AccountBalanceSource,
  type AccountRef,
} from "./source";

const ref: AccountRef = {
  accountId: AccountIdSchema.parse("js:2:ethereum:0xabc:"),
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
};

const source = (
  id: string,
  priority: number,
  supports: (ref: AccountRef) => boolean = () => true,
): AccountBalanceSource => ({
  id,
  priority,
  supports,
  getBalances: async () => [mockAccountBalance()],
});

describe("pickSource", () => {
  it("takes the highest priority that supports the ref — the new world when it is available", () => {
    const granular = source("granular", 10);
    const fullSync = source("full-sync", 0);
    expect(pickSource(ref, [fullSync, granular])).toBe(granular);
  });

  it("falls back when the new world does not support this ref", () => {
    const granular = source("granular", 10, () => false);
    const fullSync = source("full-sync", 0);
    expect(pickSource(ref, [granular, fullSync])).toBe(fullSync);
  });

  it("is independent of registration order", () => {
    const granular = source("granular", 10);
    const fullSync = source("full-sync", 0);
    expect(pickSource(ref, [granular, fullSync])).toBe(pickSource(ref, [fullSync, granular]));
  });

  it("returns undefined when nothing supports the ref", () => {
    expect(pickSource(ref, [source("granular", 10, () => false)])).toBeUndefined();
  });
});

describe("readAccountBalances", () => {
  it("returns the rows and names the source that answered", async () => {
    const result = await readAccountBalances(ref, [source("granular", 10)]);
    expect(result.sourceId).toBe("granular");
    expect(result.balances).toEqual([mockAccountBalance()]);
  });

  it("throws when nothing supports the ref", async () => {
    await expect(readAccountBalances(ref, [])).rejects.toThrow(NoAccountSourceError);
  });

  it("passes the abort signal down to the source", async () => {
    const controller = new AbortController();
    const seen: (AbortSignal | undefined)[] = [];
    await readAccountBalances(
      ref,
      [
        {
          ...source("granular", 10),
          getBalances: async (_ref, signal) => {
            seen.push(signal);
            return [];
          },
        },
      ],
      controller.signal,
    );
    expect(seen).toEqual([controller.signal]);
  });
});
