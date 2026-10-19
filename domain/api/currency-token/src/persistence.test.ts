import { PERSISTENCE_VERSION } from "./internals";
import {
  cryptoAssetsState,
  fulfilledTokenQuery,
  persistedCal,
  syncHashQuery,
  tokenCurrency,
  usdtToken,
} from "./fixtures";
import {
  extractHashesFromState,
  extractPersistedCALFromState,
  extractTokensFromState,
  filterExpiredTokens,
  parsePersistedCAL,
  persistedCALContentEqual,
  restoreTokensToCache,
} from "./persistence";

const usdt = usdtToken();

describe("parsePersistedCAL", () => {
  it("parses a valid persisted blob and re-validates tokens", () => {
    const parsed = parsePersistedCAL(
      persistedCal({ hashes: { ethereum: "hash1" }, timestamp: 1000 }),
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.tokens[0].data.id).toBe(usdt.id);
    expect(parsed?.hashes).toEqual({ ethereum: "hash1" });
  });

  it("survives a JSON serialization round-trip", () => {
    const extracted = extractPersistedCALFromState(
      cryptoAssetsState({ queries: { ...fulfilledTokenQuery(usdt) } }),
    );

    const parsed = parsePersistedCAL(JSON.parse(JSON.stringify(extracted)));

    expect(parsed?.tokens[0].data).toEqual(usdt);
  });

  it("returns null for an older format version", () => {
    expect(
      parsePersistedCAL(persistedCal({ tokens: [], version: PERSISTENCE_VERSION - 1 })),
    ).toBeNull();
  });

  it("returns null for a malformed token", () => {
    expect(
      parsePersistedCAL({
        version: PERSISTENCE_VERSION,
        tokens: [{ data: { id: "x" }, timestamp: 1 }],
      }),
    ).toBeNull();
  });

  it("returns null for non-object input", () => {
    expect(parsePersistedCAL("nope")).toBeNull();
    expect(parsePersistedCAL(null)).toBeNull();
  });
});

describe("extractTokensFromState", () => {
  it("should extract fulfilled token queries from RTK state", () => {
    const tokens = extractTokensFromState(
      cryptoAssetsState({ queries: { ...fulfilledTokenQuery(usdt) } }),
    );

    expect(tokens).toHaveLength(1);
    expect(tokens[0].data.id).toBe(usdt.id);
    expect(tokens[0].data.contractAddress).toBe(usdt.contractAddress);
    expect(tokens[0].data.parentCurrencyId).toBe(usdt.parentCurrencyId);
    expect(tokens[0].timestamp).toBeDefined();
  });

  it("should ignore pending queries", () => {
    expect(
      extractTokensFromState(
        cryptoAssetsState({
          queries: { ...fulfilledTokenQuery(usdt, { status: "pending" }) },
        }),
      ),
    ).toHaveLength(0);
  });

  it("should deduplicate tokens by ID", () => {
    expect(
      extractTokensFromState(
        cryptoAssetsState({
          queries: {
            ...fulfilledTokenQuery(usdt),
            ...fulfilledTokenQuery(usdt, { endpoint: "findTokenByAddressInCurrency" }),
          },
        }),
      ),
    ).toHaveLength(1);
  });

  it("should return empty array if no queries", () => {
    expect(extractTokensFromState(cryptoAssetsState({ queries: {} }))).toEqual([]);
  });

  it("should return empty array if no RTK Query state", () => {
    expect(extractTokensFromState(cryptoAssetsState({ cache: "absent" }))).toEqual([]);
  });

  it("should return empty array if queries is undefined", () => {
    expect(extractTokensFromState(cryptoAssetsState({ cache: "without-queries" }))).toEqual([]);
  });

  it("should extract token_identifier from findTokenByAddressInCurrency originalArgs", () => {
    const tokens = extractTokensFromState(
      cryptoAssetsState({
        queries: {
          ...fulfilledTokenQuery(usdt, {
            endpoint: "findTokenByAddressInCurrency",
            tokenIdentifier: "MYTOKEN-abc123",
          }),
        },
      }),
    );

    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_identifier).toBe("MYTOKEN-abc123");
  });

  it("should not set token_identifier for findTokenById queries", () => {
    const tokens = extractTokensFromState(
      cryptoAssetsState({
        queries: { ...fulfilledTokenQuery(usdt, { originalArgs: { id: usdt.id } }) },
      }),
    );

    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_identifier).toBeUndefined();
  });
});

describe("extractHashesFromState", () => {
  it("should extract hashes from getTokensSyncHash queries", () => {
    expect(
      extractHashesFromState(
        cryptoAssetsState({
          queries: {
            ...syncHashQuery("ethereum", "hash123"),
            ...syncHashQuery("polygon", "hash456"),
          },
        }),
      ),
    ).toEqual({ ethereum: "hash123", polygon: "hash456" });
  });

  it("reads a hash that is still in flight", () => {
    expect(
      extractHashesFromState(
        cryptoAssetsState({
          queries: { ...syncHashQuery("ethereum", "hash123", "pending") },
        }),
      ),
    ).toEqual({ ethereum: "hash123" });
  });

  it("reads a hash left behind by a failed refetch", () => {
    expect(
      extractHashesFromState(
        cryptoAssetsState({
          queries: { ...syncHashQuery("ethereum", "hash123", "rejected") },
        }),
      ),
    ).toEqual({ ethereum: "hash123" });
  });

  it("ignores an in-flight hash check that has no cached value", () => {
    expect(
      extractHashesFromState(
        cryptoAssetsState({
          queries: { ...syncHashQuery("ethereum", undefined, "pending") },
        }),
      ),
    ).toEqual({});
  });

  it("should return empty object when no hash queries exist", () => {
    expect(
      extractHashesFromState(cryptoAssetsState({ queries: { ...fulfilledTokenQuery(usdt) } })),
    ).toEqual({});
  });

  it("should return empty object if no RTK Query state", () => {
    expect(extractHashesFromState(cryptoAssetsState({ cache: "absent" }))).toEqual({});
  });
});

describe("extractPersistedCALFromState", () => {
  it("should extract complete PersistedCAL with tokens and hashes", () => {
    const persistedData = extractPersistedCALFromState(
      cryptoAssetsState({
        queries: {
          ...fulfilledTokenQuery(usdt),
          ...syncHashQuery("ethereum", "hash123"),
        },
      }),
    );

    expect(persistedData.version).toBe(PERSISTENCE_VERSION);
    expect(persistedData.tokens).toHaveLength(1);
    expect(persistedData.tokens[0].data.id).toBe(usdt.id);
    expect(persistedData.hashes).toEqual({ ethereum: "hash123" });
  });

  it("should extract PersistedCAL without hashes if none exist", () => {
    const persistedData = extractPersistedCALFromState(
      cryptoAssetsState({ queries: { ...fulfilledTokenQuery(usdt) } }),
    );

    expect(persistedData.version).toBe(PERSISTENCE_VERSION);
    expect(persistedData.tokens).toHaveLength(1);
    expect(persistedData.hashes).toBeUndefined();
  });
});

describe("filterExpiredTokens", () => {
  const ttl = 24 * 60 * 60 * 1000;

  it("should keep tokens within TTL", () => {
    const now = Date.now();

    expect(
      filterExpiredTokens(
        persistedCal({
          tokens: [
            { data: usdt, timestamp: now - 1000 },
            { data: usdt, timestamp: now - 12 * 60 * 60 * 1000 },
          ],
        }).tokens,
        ttl,
      ),
    ).toHaveLength(2);
  });

  it("should filter out expired tokens", () => {
    const now = Date.now();

    expect(
      filterExpiredTokens(
        persistedCal({
          tokens: [
            { data: usdt, timestamp: now - 1000 },
            { data: usdt, timestamp: now - 25 * 60 * 60 * 1000 },
          ],
        }).tokens,
        ttl,
      ),
    ).toHaveLength(1);
  });
});

describe("persistedCALContentEqual", () => {
  it("should return true when both are null", () => {
    expect(persistedCALContentEqual(null, null)).toBe(true);
  });

  it("should return false when one is null and the other is not", () => {
    const cal = persistedCal({ timestamp: 1000 });

    expect(persistedCALContentEqual(null, cal)).toBe(false);
    expect(persistedCALContentEqual(cal, null)).toBe(false);
  });

  it("should return true for same content with different timestamps", () => {
    const a = persistedCal({ hashes: { ethereum: "hash1" }, timestamp: 1000 });
    const b = persistedCal({ hashes: { ethereum: "hash1" }, timestamp: 2000 });

    expect(persistedCALContentEqual(a, b)).toBe(true);
  });

  it("should return false when hashes differ", () => {
    const a = persistedCal({ hashes: { ethereum: "hash1" }, timestamp: 1000 });
    const b = persistedCal({ hashes: { ethereum: "hash2" }, timestamp: 1000 });

    expect(persistedCALContentEqual(a, b)).toBe(false);
  });

  it("should return false when token set differs", () => {
    const usdc = tokenCurrency({
      id: "ethereum/erc20/usdc",
      contractAddress: "0xa0b8",
      name: "USD Coin",
      ticker: "USDC",
      units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
    });
    const a = persistedCal({ tokens: [usdt], timestamp: 1000 });
    const b = persistedCal({ tokens: [usdt, usdc], timestamp: 1000 });

    expect(persistedCALContentEqual(a, b)).toBe(false);
  });

  it("should return false when token data differs", () => {
    const changedToken = tokenCurrency({ ticker: "USDC" });
    const a = persistedCal({ tokens: [usdt], timestamp: 1000 });
    const b = persistedCal({ tokens: [changedToken], timestamp: 1000 });

    expect(persistedCALContentEqual(a, b)).toBe(false);
  });
});

describe("restoreTokensToCache", () => {
  const ttl = 24 * 60 * 60 * 1000;

  it("should restore valid tokens to RTK Query cache", () => {
    const mockDispatch = jest.fn();

    restoreTokensToCache(mockDispatch, persistedCal({ timestamp: Date.now() }), ttl);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("should skip expired tokens", () => {
    const mockDispatch = jest.fn();

    restoreTokensToCache(
      mockDispatch,
      persistedCal({ timestamp: Date.now() - 25 * 60 * 60 * 1000 }),
      ttl,
    );

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("should restore tokens even when the parent currency is unknown (guard moved to the converter)", () => {
    const mockDispatch = jest.fn();
    const orphanToken = tokenCurrency({
      id: "ethereum/erc20/orphan",
      contractAddress: "0xabc",
      parentCurrencyId: "unknown_currency",
      name: "Orphan",
      ticker: "ORPH",
      units: [{ name: "Orphan", code: "ORPH", magnitude: 18 }],
    });

    restoreTokensToCache(
      mockDispatch,
      persistedCal({ tokens: [orphanToken], timestamp: Date.now() }),
      ttl,
    );

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
