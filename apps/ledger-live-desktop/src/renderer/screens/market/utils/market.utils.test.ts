/**
 * @jest-environment jsdom
 */

import { getCurrentPage, isAvailableOnBuy, isAvailableOnSell, isAvailableOnSwap } from "../utils";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";

describe("Market utils", () => {
  describe("getCurrentPage", () => {
    it("Should return 1", () => {
      const page = getCurrentPage(0, 50);

      expect(page).toEqual(1);
    });

    it("Should return 5", () => {
      const page = getCurrentPage(17500, 50);

      expect(page).toEqual(5);
    });
  });

  describe("availability Swap or Buy", () => {
    describe("Should test availability for Buy action", () => {
      it("Should return false when currency is null or undefined", () => {
        expect(isAvailableOnBuy(null, () => true)).toBeFalsy();
        expect(isAvailableOnBuy(undefined, () => true)).toBeFalsy();
      });

      it("Should return true when ledgerIds is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnBuy(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when ledgerIds is available but isCurrencyAvailable returns false", () => {
        const isAvailable = isAvailableOnBuy(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          () => false,
        );
        expect(isAvailable).toBeFalsy();
      });

      it("Should return true when one of the ledgerIds is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnBuy(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when no ledgerIds are available", () => {
        const isAvailable = isAvailableOnBuy(
          createMockMarketCurrencyData({ ledgerIds: ["ltc"] }),
          () => false,
        );
        expect(isAvailable).toBeFalsy();
      });
    });

    describe("Should test availability for Sell action", () => {
      it("Should return false when currency is null or undefined", () => {
        expect(isAvailableOnSell(null, () => true)).toBeFalsy();
        expect(isAvailableOnSell(undefined, () => true)).toBeFalsy();
      });

      it("Should return true when ledgerIds is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnSell(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when ledgerIds is available but isCurrencyAvailable returns false", () => {
        const isAvailable = isAvailableOnSell(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          () => false,
        );
        expect(isAvailable).toBeFalsy();
      });

      it("Should return true when one of the ledgerIds is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnSell(
          createMockMarketCurrencyData({ ledgerIds: ["btc", "btc-false"] }),
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when no ledgerIds are available", () => {
        const isAvailable = isAvailableOnSell(
          createMockMarketCurrencyData({ ledgerIds: ["ltc"] }),
          () => false,
        );
        expect(isAvailable).toBeFalsy();
      });
    });

    // Tests pour isAvailableOnSwap
    describe("Should test availability for Swap action", () => {
      it("Should return false when currency is null or undefined", () => {
        expect(isAvailableOnSwap(null, new Set(["btc"]))).toBeFalsy();
        expect(isAvailableOnSwap(undefined, new Set(["btc"]))).toBeFalsy();
      });

      it("Should return true when ledgerIds is in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          new Set(["btc"]),
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when ledgerIds is not in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          new Set(["ltc"]),
        );
        expect(isAvailable).toBeFalsy();
      });

      it("Should return true when one of the ledgerIds is in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          createMockMarketCurrencyData({ ledgerIds: ["btc"] }),
          new Set(["btc"]),
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when no ledgerIds are in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          createMockMarketCurrencyData({ ledgerIds: ["ltc"] }),
          new Set(["btc"]),
        );
        expect(isAvailable).toBeFalsy();
      });
    });
  });
});
