import {
  getAssetDetailPath,
  getMarketOrAssetDetailPath,
  resolveLegacyCryptoCurrencyId,
} from "../marketAssetNavigation";

describe("marketAssetNavigation", () => {
  describe("getMarketOrAssetDetailPath", () => {
    it("returns asset path when aggregated assets are on", () => {
      expect(getMarketOrAssetDetailPath("bitcoin", true)).toBe("/asset/bitcoin");
    });

    it("returns market path when aggregated assets are off", () => {
      expect(getMarketOrAssetDetailPath("bitcoin", false)).toBe("/market/bitcoin");
    });

    it("encodes special characters in the path segment", () => {
      expect(getMarketOrAssetDetailPath("a/b", true)).toBe("/asset/a%2Fb");
    });

    it("does not double-encode segments already percent-encoded from deeplink pathname", () => {
      expect(getMarketOrAssetDetailPath("a%2Fb", true)).toBe("/asset/a%2Fb");
      expect(getMarketOrAssetDetailPath("a%2Fb", false)).toBe("/market/a%2Fb");
    });
  });

  describe("getAssetDetailPath", () => {
    it("encodes the currency id segment", () => {
      expect(getAssetDetailPath("bitcoin")).toBe("/asset/bitcoin");
    });

    it("does not double-encode segments already percent-encoded from deeplink pathname", () => {
      expect(getAssetDetailPath("a%2Fb")).toBe("/asset/a%2Fb");
    });
  });

  describe("resolveLegacyCryptoCurrencyId", () => {
    it("returns canonical id for a known currency", () => {
      expect(resolveLegacyCryptoCurrencyId("BiTcOiN")).toBe("bitcoin");
    });

    it("returns null for unknown currency", () => {
      expect(resolveLegacyCryptoCurrencyId("unknown_coin")).toBeNull();
    });

    it("returns null for whitespace-only input", () => {
      expect(resolveLegacyCryptoCurrencyId("   ")).toBeNull();
    });
  });
});
