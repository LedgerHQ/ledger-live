import { isWallet40Page, shouldDisplayRightPanel } from "../utils";

describe("Page utils", () => {
  describe("isWallet40Page", () => {
    it("returns true for wallet 4.0 root pages", () => {
      expect(isWallet40Page("/")).toBe(true);
      expect(isWallet40Page("/market")).toBe(true);
      expect(isWallet40Page("/analytics")).toBe(true);
    });

    it("returns true for wallet 4.0 prefixed pages", () => {
      expect(isWallet40Page("/card")).toBe(true);
      expect(isWallet40Page("/swap")).toBe(true);
      expect(isWallet40Page("/swap/bridge")).toBe(true);
    });

    it("returns false for non wallet 4.0 pages", () => {
      expect(isWallet40Page("/accounts")).toBe(false);
    });
  });

  describe("shouldDisplayRightPanel", () => {
    it("returns true only for right panel pages", () => {
      expect(shouldDisplayRightPanel("/")).toBe(true);
      expect(shouldDisplayRightPanel("/analytics")).toBe(true);
      expect(shouldDisplayRightPanel("/market")).toBe(false);
    });
  });
});
