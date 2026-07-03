import { parseLedgerAssetPath, resolveLedgerCryptoCurrencyId } from "../ledgerAssetPath";

describe("ledger asset path utils", () => {
  describe("parseLedgerAssetPath", () => {
    it("returns null for an empty path", () => {
      expect(parseLedgerAssetPath(null)).toBeNull();
      expect(parseLedgerAssetPath("")).toBeNull();
      expect(parseLedgerAssetPath("   ")).toBeNull();
    });

    it("returns the canonical currency id for a coin path", () => {
      expect(parseLedgerAssetPath("/BiTcOiN")).toEqual({
        currencyId: "bitcoin",
        assetId: "bitcoin",
      });
    });

    it("returns the full Ledger token id for a token path", () => {
      expect(parseLedgerAssetPath("/ethereum/erc20/usd_tether__erc20_")).toEqual({
        currencyId: "ethereum",
        assetId: "ethereum/erc20/usd_tether__erc20_",
        ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
      });
    });

    it("supports Ledger token id characters beyond underscores", () => {
      expect(parseLedgerAssetPath("/ethereum/erc20/uniswap_(bridged)")).toEqual({
        currencyId: "ethereum",
        assetId: "ethereum/erc20/uniswap_(bridged)",
        ledgerIds: ["ethereum/erc20/uniswap_(bridged)"],
      });
      expect(parseLedgerAssetPath("/stellar/asset/usdc:ga5z")).toEqual({
        currencyId: "stellar",
        assetId: "stellar/asset/usdc:ga5z",
        ledgerIds: ["stellar/asset/usdc:ga5z"],
      });
    });

    it("returns null when the parent currency is unknown", () => {
      expect(parseLedgerAssetPath("/unknown/erc20/usd_tether__erc20_")).toBeNull();
    });

    it("returns null when the path contains an empty segment", () => {
      expect(parseLedgerAssetPath("/ethereum//erc20/usd_tether__erc20_")).toBeNull();
    });

    it("returns null when a segment contains unsupported characters", () => {
      expect(parseLedgerAssetPath("/ethereum/erc20/<script>")).toBeNull();
    });

    it("returns null when a segment contains an encoded slash", () => {
      expect(parseLedgerAssetPath("/ethereum%2Ferc20")).toBeNull();
    });

    it("decodes supported percent-encoded segment characters", () => {
      expect(parseLedgerAssetPath("/ethereum/erc20/usd_tether%5F%5Ferc20%5F")).toEqual({
        currencyId: "ethereum",
        assetId: "ethereum/erc20/usd_tether__erc20_",
        ledgerIds: ["ethereum/erc20/usd_tether__erc20_"],
      });
    });
  });

  describe("resolveLedgerCryptoCurrencyId", () => {
    it("returns canonical id for a known currency", () => {
      expect(resolveLedgerCryptoCurrencyId("BiTcOiN")).toBe("bitcoin");
    });

    it("returns null for unknown or empty currency ids", () => {
      expect(resolveLedgerCryptoCurrencyId("unknown_coin")).toBeNull();
      expect(resolveLedgerCryptoCurrencyId("   ")).toBeNull();
      expect(resolveLedgerCryptoCurrencyId(null)).toBeNull();
    });
  });
});
