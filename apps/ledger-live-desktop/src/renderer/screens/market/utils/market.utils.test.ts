/**
 * @jest-environment jsdom
 */

import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  BASIC_REFETCH,
  REFETCH_TIME_ONE_MINUTE,
  getCurrentPage,
  isAvailableOnBuy,
  isAvailableOnSwap,
  isDataStale,
} from "../utils";
import { CurrencyData } from "@ledgerhq/live-common/market/utils/types";

describe("Market utils", () => {
  describe("isDataStale", () => {
    it("Should return stale === true", () => {
      const current = new Date();
      const isStaled = isDataStale(1711733433593, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const isStaled2 = isDataStale(156733433533, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const isStaled3 = isDataStale(1211333433593, REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);

      const fiveMinuteStale = isDataStale(
        current.setMinutes(current.getMinutes() - 5),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      expect(isStaled).toBeTruthy();
      expect(isStaled2).toBeTruthy();
      expect(isStaled3).toBeTruthy();
      expect(fiveMinuteStale).toBeTruthy();
    });

    it("Should return stale === false", () => {
      const current = new Date();

      const isStaled = isDataStale(current.getTime(), REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH);
      const oneMinuteFresh = isDataStale(
        current.setMinutes(current.getMinutes() - 1),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      const oneMinute59Fresh = isDataStale(
        current.setMinutes(current.getMinutes() - 1, current.getSeconds() - 59),
        REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH,
      );

      expect(isStaled).toBeFalsy();
      expect(oneMinuteFresh).toBeFalsy();
      expect(oneMinute59Fresh).toBeFalsy();
    });
  });

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

      it("Should return true when internalCurrency.id is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnBuy(
          {
            internalCurrency: { id: "btc" } as CryptoOrTokenCurrency,
            ledgerIds: ["btc"],
          } as CurrencyData,
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when internalCurrency.id is available but isCurrencyAvailable returns false", () => {
        const isAvailable = isAvailableOnBuy(
          {
            internalCurrency: { id: "btc" } as CryptoOrTokenCurrency,
            ledgerIds: ["btc"],
          } as CurrencyData,
          () => false,
        );
        expect(isAvailable).toBeFalsy();
      });

      it("Should return true when one of the ledgerIds is available and isCurrencyAvailable returns true", () => {
        const isAvailable = isAvailableOnBuy(
          {
            ledgerIds: ["btc"],
          } as CurrencyData,
          () => true,
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when neither internalCurrency nor ledgerIds are available", () => {
        const isAvailable = isAvailableOnBuy(
          {
            ledgerIds: ["ltc"],
          } as CurrencyData,
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

      it("Should return true when internalCurrency.id is in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          {
            internalCurrency: { id: "btc" } as CryptoOrTokenCurrency,
            ledgerIds: ["btc"],
          } as CurrencyData,
          new Set(["btc"]),
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when internalCurrency.id is not in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          {
            internalCurrency: { id: "btc" } as CryptoOrTokenCurrency,
            ledgerIds: ["btc"],
          } as CurrencyData,
          new Set(["ltc"]),
        );
        expect(isAvailable).toBeFalsy();
      });

      it("Should return true when one of the ledgerIds is in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          {
            ledgerIds: ["btc"],
          } as CurrencyData,
          new Set(["btc"]),
        );
        expect(isAvailable).toBeTruthy();
      });

      it("Should return false when neither internalCurrency.id nor any ledgerIds are in the swap set", () => {
        const isAvailable = isAvailableOnSwap(
          {
            ledgerIds: ["ltc"],
          } as CurrencyData,
          new Set(["btc"]),
        );
        expect(isAvailable).toBeFalsy();
      });
    });
  });
});
