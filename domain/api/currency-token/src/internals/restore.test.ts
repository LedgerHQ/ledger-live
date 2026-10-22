import { token } from "@domain/entity-currency-token";
import type { PersistedTokenEntry } from "../types";
import {
  buildRestoreCacheEntries,
  groupTokensByCurrency,
  resolveCurrenciesToEvict,
} from "./restore";

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

  it("adds a token_identifier lookup entry only for a token such a lookup resolved", () => {
    const resolved = { ...entry("tron/trc10/1002000", "tron"), token_identifier_lookup: "1002000" };
    const unresolved = entry("tezos/fa2/a", "tezos", "0");

    const lookupEntries = buildRestoreCacheEntries([resolved, unresolved]).filter(
      e => e.endpointName === "findTokenByTokenIdentifierInCurrency",
    );

    expect(lookupEntries).toEqual([
      {
        endpointName: "findTokenByTokenIdentifierInCurrency",
        arg: { token_identifier: "1002000", network: "tron" },
        value: resolved.data,
      },
    ]);
  });
});

describe("resolveCurrenciesToEvict", () => {
  type Dispatch = Parameters<typeof resolveCurrenciesToEvict>[0];

  function currencies(...ids: string[]): Map<string, PersistedTokenEntry[]> {
    const map = new Map<string, PersistedTokenEntry[]>();
    for (const id of ids) map.set(id, []);
    return map;
  }

  it("does not evict currencies without a stored hash", async () => {
    const dispatch = jest.fn();
    const evict = await resolveCurrenciesToEvict(
      dispatch as unknown as Dispatch,
      currencies("ethereum"),
      {},
    );

    expect(evict.size).toBe(0);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("does not evict when the current hash matches the stored one", async () => {
    const dispatch = jest.fn().mockResolvedValue({ data: "hash1" });
    const evict = await resolveCurrenciesToEvict(
      dispatch as unknown as Dispatch,
      currencies("ethereum"),
      {
        ethereum: "hash1",
      },
    );

    expect(evict.has("ethereum")).toBe(false);
  });

  it("evicts when the current hash differs", async () => {
    const dispatch = jest.fn().mockResolvedValue({ data: "hash2" });
    const evict = await resolveCurrenciesToEvict(
      dispatch as unknown as Dispatch,
      currencies("ethereum"),
      {
        ethereum: "hash1",
      },
    );

    expect(evict.has("ethereum")).toBe(true);
  });

  it("evicts when the hash fetch fails", async () => {
    const dispatch = jest.fn().mockRejectedValue(new Error("network"));
    const evict = await resolveCurrenciesToEvict(
      dispatch as unknown as Dispatch,
      currencies("ethereum"),
      {
        ethereum: "hash1",
      },
    );

    expect(evict.has("ethereum")).toBe(true);
  });
});
