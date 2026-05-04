import { isWallet40Page, shouldDisplayRightPanel } from "../utils";

describe("Page utils", () => {
  describe("isWallet40Page", () => {
    it("returns true for each wallet 4.0 exact-match route", () => {
      expect(isWallet40Page("/")).toBe(true);
      expect(isWallet40Page("/market")).toBe(true);
      expect(isWallet40Page("/analytics")).toBe(true);
      expect(isWallet40Page("/cryptos")).toBe(true);
      expect(isWallet40Page("/assets")).toBe(true);
      expect(isWallet40Page("/earn")).toBe(true);
      expect(isWallet40Page("/perps")).toBe(true);
      expect(isWallet40Page("/borrow")).toBe(true);
      expect(isWallet40Page("/history")).toBe(true);
    });

    it("returns true for wallet 4.0 prefix routes and nested paths", () => {
      expect(isWallet40Page("/card")).toBe(true);
      expect(isWallet40Page("/card/foo")).toBe(true);
      expect(isWallet40Page("/swap")).toBe(true);
      expect(isWallet40Page("/swap/bridge")).toBe(true);
      expect(isWallet40Page("/exchange")).toBe(true);
      expect(isWallet40Page("/exchange/foo")).toBe(true);
    });

    it("returns false for routes outside wallet 4.0", () => {
      expect(isWallet40Page("/accounts")).toBe(false);
      expect(isWallet40Page("/settings")).toBe(false);
    });

    it("returns false when pathname is not an exact match and does not start with a known prefix", () => {
      expect(isWallet40Page("/market/trending")).toBe(false);
      expect(isWallet40Page("/cryptos/extra")).toBe(false);
    });
  });

  describe("shouldDisplayRightPanel", () => {
    it("returns true only for routes that show the swap sidebar", () => {
      expect(shouldDisplayRightPanel("/")).toBe(true);
      expect(shouldDisplayRightPanel("/analytics")).toBe(true);
      expect(shouldDisplayRightPanel("/cryptos")).toBe(true);
    });

    it("returns false for other wallet 4.0 pages", () => {
      expect(shouldDisplayRightPanel("/market")).toBe(false);
      expect(shouldDisplayRightPanel("/assets")).toBe(false);
      expect(shouldDisplayRightPanel("/earn")).toBe(false);
    });
  });
});
