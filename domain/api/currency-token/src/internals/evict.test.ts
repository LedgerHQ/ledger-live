import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import { snapshotTokenRequests, staleTokenQueryKeys, type TokenQueryEntry } from "./evict";

function tokenEntry(overrides: Partial<TokenQueryEntry> = {}): TokenQueryEntry {
  return {
    endpointName: "findTokenById",
    status: "fulfilled",
    data: { id: "ethereum/erc20/usdt", parentCurrencyId: "ethereum" },
    requestId: "restored",
    ...overrides,
  };
}

function keys(snapshot: ReadonlyMap<QueryCacheKey, string>) {
  return [...snapshot.keys()];
}

describe("snapshotTokenRequests", () => {
  it("records a settled lookup of the currency with its request id", () => {
    const snapshot = snapshotTokenRequests({ a: tokenEntry() }, "ethereum");
    expect([...snapshot]).toEqual([["a", "restored"]]);
  });

  it("skips a lookup that is still in flight", () => {
    const queries = { a: tokenEntry({ status: "pending" }) };
    expect(keys(snapshotTokenRequests(queries, "ethereum"))).toEqual([]);
  });

  it("skips the lookups of another currency", () => {
    const queries = {
      a: tokenEntry({ data: { id: "polygon/erc20/usdt", parentCurrencyId: "polygon" } }),
    };
    expect(keys(snapshotTokenRequests(queries, "ethereum"))).toEqual([]);
  });

  it("matches a cached findTokenById miss by the currency in its id", () => {
    const queries = {
      a: tokenEntry({ data: undefined, originalArgs: { id: "ethereum/erc20/new_token" } }),
    };
    expect(keys(snapshotTokenRequests(queries, "ethereum"))).toEqual(["a"]);
  });

  it("matches an empty address lookup by its network argument", () => {
    const queries = {
      a: tokenEntry({
        endpointName: "findTokenByAddressInCurrency",
        data: undefined,
        originalArgs: { contract_address: "0xabc", network: "ethereum" },
      }),
    };
    expect(keys(snapshotTokenRequests(queries, "ethereum"))).toEqual(["a"]);
  });

  it("ignores other endpoints", () => {
    const queries = { a: tokenEntry({ endpointName: "getTokensSyncHash", data: "hash" }) };
    expect(keys(snapshotTokenRequests(queries, "ethereum"))).toEqual([]);
  });
});

describe("staleTokenQueryKeys", () => {
  const snapshot = snapshotTokenRequests({ a: tokenEntry() }, "ethereum");

  it("returns a lookup that still holds the request from the snapshot", () => {
    expect(staleTokenQueryKeys({ a: tokenEntry() }, snapshot)).toEqual(["a"]);
  });

  it("keeps a lookup that a later request replaced", () => {
    expect(staleTokenQueryKeys({ a: tokenEntry({ requestId: "fresh" }) }, snapshot)).toEqual([]);
  });

  it("keeps an in-place refetch that is still in flight", () => {
    const queries = { a: tokenEntry({ status: "pending", requestId: "refetch" }) };
    expect(staleTokenQueryKeys(queries, snapshot)).toEqual([]);
  });

  it("ignores a lookup that left the cache", () => {
    expect(staleTokenQueryKeys({}, snapshot)).toEqual([]);
  });
});
