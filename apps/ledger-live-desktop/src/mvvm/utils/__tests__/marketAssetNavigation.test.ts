import { getAssetDetailPath, isAssetDetailPath } from "../marketAssetNavigation";

describe("marketAssetNavigation", () => {
  describe("getAssetDetailPath", () => {
    it("encodes the currency id segment", () => {
      expect(getAssetDetailPath("bitcoin")).toBe("/asset/bitcoin");
    });

    it("does not double-encode segments already percent-encoded from deeplink pathname", () => {
      expect(getAssetDetailPath("a%2Fb")).toBe("/asset/a%2Fb");
    });
  });

  describe("isAssetDetailPath", () => {
    it("returns true for an asset detail path", () => {
      expect(isAssetDetailPath("/asset/bitcoin")).toBe(true);
    });

    it("returns false for a market detail path", () => {
      expect(isAssetDetailPath("/market/bitcoin")).toBe(false);
    });

    it("returns false for the home path", () => {
      expect(isAssetDetailPath("/")).toBe(false);
    });

    it("returns false for the market list path", () => {
      expect(isAssetDetailPath("/market")).toBe(false);
    });

    it("returns false for the bare asset path", () => {
      expect(isAssetDetailPath("/asset")).toBe(false);
    });

    it("returns false for the bare asset path with a trailing slash", () => {
      expect(isAssetDetailPath("/asset/")).toBe(false);
    });

    it("returns false for an unrelated path", () => {
      expect(isAssetDetailPath("/accounts")).toBe(false);
    });
  });
});
