import {
  fetchBalances,
  fetchFungibleTokenMetadata,
  fetchTokenBalancesPage,
  fetchTransactionsPage,
} from "./api";

const ADDRESS = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";

describe("Stacks network API integration", () => {
  describe("fetchBalances", () => {
    it("should hit the v2 balances endpoint and return data when accessible", async () => {
      const result = await fetchBalances(ADDRESS);
      expect(BigInt(result.balance)).toBeGreaterThan(0);
    });
  });

  describe("fetchTokenBalancesPage", () => {
    it("should fetch a page of token balances", async () => {
      const result = await fetchTokenBalancesPage(ADDRESS, 0, 10);

      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(result.results.length);
    });
  });

  describe("fetchTransactionsPage", () => {
    it("should fetch a page of transactions", async () => {
      const result = await fetchTransactionsPage(ADDRESS, 0, 20);

      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
      expect(result.total).toBeGreaterThanOrEqual(result.results.length);
      result.results.forEach(transaction => {
        expect(transaction.tx.block_height).toBeGreaterThan(0);
      });
    });
  });

  describe.only("fetchFungibleTokenMetadata", () => {
    it("should fetch fungible token metadata", async () => {
      const result = await fetchFungibleTokenMetadata(
        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
      );
      expect(result.limit).toBeGreaterThan(0);
      expect(result.offset).toBe(0);
      expect(result.total).toBeGreaterThan(0);
      result.results.forEach(result => {
        expect(result.asset_identifier).toEqual(expect.any(String));
      });
    });
  });
});
