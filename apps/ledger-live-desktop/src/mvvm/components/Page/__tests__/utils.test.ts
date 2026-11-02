import {
  getRightPanelVariant,
  isFullscreenOverlayRoute,
  isWallet40Page,
  shouldDisplayRightPanel,
} from "../utils";

describe("Page utils", () => {
  describe("isFullscreenOverlayRoute", () => {
    it("returns true for Recover player routes matching /recover/:appId", () => {
      expect(isFullscreenOverlayRoute("/recover/protect-prod")).toBe(true);
    });

    it("returns true for Perps webview routes matching /perps prefix", () => {
      expect(isFullscreenOverlayRoute("/perps")).toBe(true);
      expect(isFullscreenOverlayRoute("/perps/market")).toBe(true);
    });

    it("returns false for standard app routes", () => {
      expect(isFullscreenOverlayRoute("/")).toBe(false);
      expect(isFullscreenOverlayRoute("/accounts")).toBe(false);
      expect(isFullscreenOverlayRoute("/recover-restore")).toBe(false);
      expect(isFullscreenOverlayRoute("/recover")).toBe(false);
      expect(isFullscreenOverlayRoute("/recover/")).toBe(false);
      expect(isFullscreenOverlayRoute("/perps-extra")).toBe(false);
    });
  });

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
      expect(isWallet40Page("/asset")).toBe(true);
      expect(isWallet40Page("/asset/btc")).toBe(true);
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
      expect(shouldDisplayRightPanel("/cryptos")).toBe(false);
    });

    it("returns false for other wallet 4.0 pages", () => {
      expect(shouldDisplayRightPanel("/market")).toBe(false);
      expect(shouldDisplayRightPanel("/assets")).toBe(false);
      expect(shouldDisplayRightPanel("/earn")).toBe(false);
    });

    describe("/asset routes", () => {
      it("returns true for asset detail routes", () => {
        expect(shouldDisplayRightPanel("/asset")).toBe(true);
        expect(shouldDisplayRightPanel("/asset/btc")).toBe(true);
      });

      it("does not treat /assets as an aggregated asset detail route", () => {
        expect(shouldDisplayRightPanel("/assets")).toBe(false);
      });
    });

    describe("/account routes (conditional on isAccountDetailPage)", () => {
      it("returns false for account routes when the account detail page is off", () => {
        expect(shouldDisplayRightPanel("/account/abc")).toBe(false);
        expect(shouldDisplayRightPanel("/account/abc", { isAccountDetailPage: false })).toBe(false);
      });

      it("returns true for account routes when the account detail page is on", () => {
        expect(shouldDisplayRightPanel("/account/abc", { isAccountDetailPage: true })).toBe(true);
        expect(shouldDisplayRightPanel("/account/parent/abc", { isAccountDetailPage: true })).toBe(
          true,
        );
      });

      it("does not treat /accounts as an account detail route", () => {
        expect(shouldDisplayRightPanel("/accounts", { isAccountDetailPage: true })).toBe(false);
      });
    });
  });

  describe("getRightPanelVariant", () => {
    it("returns 'card' on the Pay tab", () => {
      expect(getRightPanelVariant("/paytab")).toBe("card");
    });

    it("returns 'swap' on swap-enabled routes", () => {
      expect(getRightPanelVariant("/")).toBe("swap");
      expect(getRightPanelVariant("/analytics")).toBe("swap");
      expect(getRightPanelVariant("/asset/btc")).toBe("swap");
      expect(getRightPanelVariant("/account/abc", { isAccountDetailPage: true })).toBe("swap");
    });

    it("returns undefined on routes without a right panel", () => {
      expect(getRightPanelVariant("/market")).toBeUndefined();
      expect(getRightPanelVariant("/accounts")).toBeUndefined();
      expect(getRightPanelVariant("/account/abc")).toBeUndefined();
    });
  });
});
