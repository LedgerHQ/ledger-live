import { token } from "@domain/entity-currency-token";
import type { PersistedTokenEntry } from "../types";
import { buildHashCacheEntries, buildRestoreCacheEntries, groupTokensByCurrency } from "./restore";

function entry(
  id: string,
  parentCurrencyId: string,
  tokenIdentifier?: string,
): PersistedTokenEntry {
  return {
    data: token({
      type: "TokenCurrency",
      id,
      parentCurrencyId,
      contractAddress: "0xabc",
      tokenType: "erc20",
      name: "Test",
      ticker: "TEST",
      units: [{ name: "Test", code: "TEST", magnitude: 0 }],
    }),
    timestamp: Date.now(),
    ...(tokenIdentifier === undefined ? {} : { token_identifier: tokenIdentifier }),
  };
}

describe("groupTokensByCurrency", () => {
  it("groups entries by parentCurrencyId", () => {
    const grouped = groupTokensByCurrency([
      entry("ethereum/erc20/a", "ethereum"),
      entry("ethereum/erc20/b", "ethereum"),
      entry("polygon/erc20/c", "polygon"),
    ]);

    expect(grouped.get("ethereum")).toHaveLength(2);
    expect(grouped.get("polygon")).toHaveLength(1);
  });

  it("returns an empty map for no tokens", () => {
    expect(groupTokensByCurrency([]).size).toBe(0);
  });
});

describe("buildRestoreCacheEntries", () => {
  it("builds an id + address entry per token", () => {
    const entries = buildRestoreCacheEntries([entry("ethereum/erc20/a", "ethereum")]);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      endpointName: "findTokenById",
      arg: { id: "ethereum/erc20/a" },
    });
    expect(entries[1]).toMatchObject({
      endpointName: "findTokenByAddressInCurrency",
      arg: { contract_address: "0xabc", network: "ethereum" },
    });
  });

  it("adds an address-only entry when token_identifier is present", () => {
    const entries = buildRestoreCacheEntries([entry("elrond/esdt/a", "elrond", "MYTOKEN-1")]);
    const addressEntries = entries.filter(e => e.endpointName === "findTokenByAddressInCurrency");

    expect(entries).toHaveLength(3);
    expect(
      addressEntries.some(
        e => "token_identifier" in e.arg && e.arg.token_identifier === "MYTOKEN-1",
      ),
    ).toBe(true);
    expect(addressEntries.some(e => !("token_identifier" in e.arg))).toBe(true);
  });
});

describe("buildHashCacheEntries", () => {
  it("builds one getTokensSyncHash entry per stored hash", () => {
    expect(buildHashCacheEntries({ ethereum: "hash1", polygon: "hash2" })).toEqual([
      { endpointName: "getTokensSyncHash", arg: "ethereum", value: "hash1" },
      { endpointName: "getTokensSyncHash", arg: "polygon", value: "hash2" },
    ]);
  });
});
