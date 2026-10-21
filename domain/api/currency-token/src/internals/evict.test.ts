import { staleTokenQueryKeys, type TokenQueryEntry } from "./evict";

const CHECK_STARTED_AT = 1_000;

function tokenEntry(overrides: Partial<TokenQueryEntry> = {}): TokenQueryEntry {
  return {
    endpointName: "findTokenById",
    status: "fulfilled",
    data: { id: "ethereum/erc20/usdt", parentCurrencyId: "ethereum" },
    fulfilledTimeStamp: CHECK_STARTED_AT - 1,
    ...overrides,
  };
}

describe("staleTokenQueryKeys", () => {
  it("returns a lookup that settled before the check started", () => {
    expect(staleTokenQueryKeys({ a: tokenEntry() }, "ethereum", CHECK_STARTED_AT)).toEqual(["a"]);
  });

  it("returns a lookup that settled in the same millisecond as the check start", () => {
    const queries = { a: tokenEntry({ fulfilledTimeStamp: CHECK_STARTED_AT }) };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual(["a"]);
  });

  it("keeps a lookup that settled after the check started", () => {
    const queries = { a: tokenEntry({ fulfilledTimeStamp: CHECK_STARTED_AT + 1 }) };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual([]);
  });

  it("keeps a lookup that is still in flight", () => {
    const queries = { a: tokenEntry({ status: "pending", fulfilledTimeStamp: undefined }) };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual([]);
  });

  it("keeps the lookups of another currency", () => {
    const queries = {
      a: tokenEntry({ data: { id: "polygon/erc20/usdt", parentCurrencyId: "polygon" } }),
    };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual([]);
  });

  it("matches an empty address lookup by its network argument", () => {
    const queries = {
      a: tokenEntry({
        endpointName: "findTokenByAddressInCurrency",
        data: undefined,
        originalArgs: { contract_address: "0xabc", network: "ethereum" },
      }),
    };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual(["a"]);
  });

  it("ignores other endpoints", () => {
    const queries = { a: tokenEntry({ endpointName: "getTokensSyncHash", data: "hash" }) };
    expect(staleTokenQueryKeys(queries, "ethereum", CHECK_STARTED_AT)).toEqual([]);
  });
});
