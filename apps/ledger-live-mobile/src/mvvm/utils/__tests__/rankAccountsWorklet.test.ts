import {
  countRankedAccountItems,
  makeHeavyAccountSnapshots,
  rankAccountSnapshots,
  type AccountSnapshot,
} from "../rankAccountsWorklet";

const parent = (
  overrides: Partial<AccountSnapshot> & Pick<AccountSnapshot, "id">,
): AccountSnapshot => ({
  value: 0,
  tokenId: null,
  currencyId: "btc",
  balance: 0,
  pendingCount: 0,
  swapCount: 0,
  ...overrides,
});

describe("rankAccountSnapshots", () => {
  it("should flatten nested token accounts before ranking", () => {
    const result = rankAccountSnapshots({
      snapshots: [
        parent({
          id: "eth",
          value: 10,
          currencyId: "eth",
          subAccounts: [
            parent({ id: "usdt", value: 50, tokenId: "usdt", currencyId: "usdt" }),
            parent({ id: "usdc", value: 5, tokenId: "usdc", currencyId: "usdc" }),
          ],
        }),
      ],
      excludedTokenIds: [],
    });

    expect(result.ids).toEqual(["usdt", "eth", "usdc"]);
  });

  it("should drop blacklisted token accounts and keep the parent", () => {
    const result = rankAccountSnapshots({
      snapshots: [
        parent({
          id: "eth",
          value: 1,
          currencyId: "eth",
          subAccounts: [parent({ id: "bad", value: 99, tokenId: "spam", currencyId: "spam" })],
        }),
      ],
      excludedTokenIds: ["spam"],
    });

    expect(result.ids).toEqual(["eth"]);
  });

  it("should group flattened accounts by currency value", () => {
    const result = rankAccountSnapshots({
      snapshots: [
        parent({ id: "btc-1", value: 20, currencyId: "btc" }),
        parent({ id: "eth-1", value: 8, currencyId: "eth" }),
        parent({ id: "btc-2", value: 5, currencyId: "btc" }),
      ],
      excludedTokenIds: [],
    });

    expect(result.groups.map(group => group.currencyId)).toEqual(["btc", "eth"]);
    expect(result.groups[0]).toEqual({
      currencyId: "btc",
      ids: ["btc-1", "btc-2"],
      value: 25,
    });
  });

  it("should hash every flattened account for change detection", () => {
    const result = rankAccountSnapshots({
      snapshots: [
        parent({
          id: "eth",
          balance: 12,
          pendingCount: 2,
          swapCount: 1,
          subAccounts: [parent({ id: "usdt", tokenId: "usdt", balance: 3 })],
        }),
      ],
      excludedTokenIds: [],
    });

    expect(result.hashes).toEqual([
      "eth-12-swapHistory(1)-pending(2)",
      "usdt-3-swapHistory(0)-pending(0)",
    ]);
  });

  it("should scale the many-accounts fixture to parent plus tokens", () => {
    const snapshots = makeHeavyAccountSnapshots(4, 3);
    expect(countRankedAccountItems(snapshots)).toBe(16);
    expect(rankAccountSnapshots({ snapshots, excludedTokenIds: [] }).ids.length).toBeGreaterThan(0);
  });
});
