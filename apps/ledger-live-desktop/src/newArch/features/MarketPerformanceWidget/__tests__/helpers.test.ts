/**
 * @jest-environment jsdom
 */

import { Order } from "../types";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";
import {
  filterAvailableBuyOrSwapCurrency,
  getChangePercentage,
  getSlicedList,
  getSlicedListWithFilters,
  isAvailableOnBuyOrSwap,
} from "../utils";

const createElem = (change: number): MarketItemPerformer => ({
  name: "Bitcoin",
  image: "https://bitcoin.org/logo.png",
  priceChangePercentage1h: change,
  priceChangePercentage1y: change,
  priceChangePercentage24h: change,
  priceChangePercentage30d: change,
  priceChangePercentage7d: change,
  ticker: "BTC",
  price: 70000,
  ledgerIds: [],
  id: "bitcoin",
});

const createElemWithMultipleChange = (
  name: string,
  ticker: string,
  range: {
    priceChangePercentage1h: number;
    priceChangePercentage24h: number;
    priceChangePercentage7d: number;
    priceChangePercentage30d: number;
    priceChangePercentage1y: number;
  },
): MarketItemPerformer => ({
  name,
  image: "https://bitcoin.org/logo.png",
  priceChangePercentage1h: range.priceChangePercentage1h,
  priceChangePercentage1y: range.priceChangePercentage1y,
  priceChangePercentage24h: range.priceChangePercentage24h,
  priceChangePercentage30d: range.priceChangePercentage30d,
  priceChangePercentage7d: range.priceChangePercentage7d,
  ticker,
  price: 70000,
  ledgerIds: [],
  id: name,
});

describe("useMarketPerformanceWidget", () => {
  describe("getSlicedList", () => {
    it("Should return a list of 4 positive elements on day", () => {
      const DATA = [
        createElem(-50),
        createElem(10),
        createElem(50),
        createElem(20),
        createElem(30),
      ];

      const list = getSlicedList(DATA, Order.asc, "day");

      expect(list).toHaveLength(4);
    });

    it("Should return a list of 1 positive elements on month", () => {
      const DATA = [
        createElem(-50),
        createElem(-10),
        createElem(-50),
        createElem(20),
        createElem(-30),
      ];

      const list = getSlicedList(DATA, Order.asc, "month");

      expect(list).toHaveLength(1);
    });

    it("Should return a list of 2 positive elements on week", () => {
      const DATA = [
        createElem(-50),
        createElem(-10),
        createElem(50),
        createElem(20),
        createElem(-30),
      ];

      const list = getSlicedList(DATA, Order.asc, "week");

      expect(list).toHaveLength(2);
    });

    it("Should return a list of 2 negative elements on day", () => {
      const DATA = [
        createElem(-20),
        createElem(50),
        createElem(20),
        createElem(-50),
        createElem(30),
      ];

      const list = getSlicedList(DATA, Order.desc, "day");

      expect(list).toHaveLength(2);
    });

    it("Should return a list of 4 negative elements on month", () => {
      const DATA = [
        createElem(-50),
        createElem(-10),
        createElem(50),
        createElem(-20),
        createElem(-30),
      ];

      const list = getSlicedList(DATA, Order.desc, "month");

      expect(list).toHaveLength(4);
    });

    it("Should return a list of 3 negative elements on week", () => {
      const DATA = [
        createElem(-50),
        createElem(-10),
        createElem(50),
        createElem(20),
        createElem(-30),
      ];

      const list = getSlicedList(DATA, Order.desc, "week");

      expect(list).toHaveLength(3);
    });
  });

  describe("getChangePercentage", () => {
    const elem = createElemWithMultipleChange("Bitcoin", "BTC", {
      priceChangePercentage1h: 10,
      priceChangePercentage24h: 20,
      priceChangePercentage7d: 30,
      priceChangePercentage30d: 40,
      priceChangePercentage1y: 50,
    });

    it("Should return right percentageChange for day", () => {
      const res = getChangePercentage(elem, "day");

      expect(res).toEqual(elem.priceChangePercentage24h);
    });

    it("Should return right percentageChange for week", () => {
      const res = getChangePercentage(elem, "week");

      expect(res).toEqual(elem.priceChangePercentage7d);
    });

    it("Should return right percentageChange for month", () => {
      const res = getChangePercentage(elem, "month");

      expect(res).toEqual(elem.priceChangePercentage30d);
    });
    it("Should return right percentageChange for year", () => {
      const res = getChangePercentage(elem, "year");

      expect(res).toEqual(elem.priceChangePercentage1y);
    });
  });

  describe("isAvailableOnBuyOrSwap", () => {
    it("should return true when the currency is available for Buy", () => {
      const result = isAvailableOnBuyOrSwap("btc", new Set(["btc", "eth"]), () => true, "onRamp");
      expect(result).toBeTruthy();
    });

    it("should return false when the currency is not available for Buy", () => {
      const result = isAvailableOnBuyOrSwap("btc", new Set(["btc", "eth"]), () => false, "onRamp");
      expect(result).toBeFalsy();
    });

    it("should return true for a different currency when available for Buy", () => {
      const result = isAvailableOnBuyOrSwap("eth", new Set(["btc", "eth"]), () => true, "onRamp");
      expect(result).toBeTruthy();
    });

    it("should return false for a different currency when not available for Buy", () => {
      const result = isAvailableOnBuyOrSwap("eth", new Set(["btc", "eth"]), () => false, "onRamp");
      expect(result).toBeFalsy();
    });

    it("should return true when the currency is available for swap", () => {
      const result = isAvailableOnBuyOrSwap("btc", new Set(["btc", "eth"]), () => true, "swap");
      expect(result).toBeTruthy();
    });

    it("should return false when the currency is not available for swap", () => {
      const result = isAvailableOnBuyOrSwap("btc", new Set(["eth"]), () => false, "swap");
      expect(result).toBeFalsy();
    });
  });

  describe("filterAvailableBuyOrSwapCurrency", () => {
    it("should return true when the currency is in the ledger and available", () => {
      const elem = { id: "btc", ledgerIds: ["btc"] } as MarketItemPerformer;
      const result = filterAvailableBuyOrSwapCurrency(elem, (_id, _type) => true);
      expect(result).toBeTruthy();
    });

    it("should return false when the currency is not available", () => {
      const elem = { id: "btc", ledgerIds: ["btc"] } as MarketItemPerformer;
      const result = filterAvailableBuyOrSwapCurrency(elem, (_id, _type) => false);
      expect(result).toBeFalsy();
    });
  });

  describe("getSlicedListWithFilters", () => {
    const mockData = [
      createElemWithMultipleChange("bitcoin", "btc", {
        priceChangePercentage1h: 10,
        priceChangePercentage24h: 20,
        priceChangePercentage7d: 30,
        priceChangePercentage30d: 40,
        priceChangePercentage1y: 50,
      }),
      createElemWithMultipleChange("ethereum", "eth", {
        priceChangePercentage1h: 10,
        priceChangePercentage24h: 20,
        priceChangePercentage7d: 30,
        priceChangePercentage30d: 40,
        priceChangePercentage1y: 50,
      }),
      createElemWithMultipleChange("litecoin", "ltc", {
        priceChangePercentage1h: 10,
        priceChangePercentage24h: 20,
        priceChangePercentage7d: 30,
        priceChangePercentage30d: 40,
        priceChangePercentage1y: 50,
      }),
    ] as MarketItemPerformer[];

    it("should return a sliced list with filters applied when enabled", () => {
      const filterFn = (elem: MarketItemPerformer) => elem.id !== "litecoin";
      const result = getSlicedListWithFilters(mockData, Order.asc, "month", true, filterFn, 5);
      expect(result).toHaveLength(2);
      expect(result).not.toContainEqual(expect.objectContaining({ id: "litecoin" }));
    });

    it("should return the full sliced list when filters are disabled", () => {
      const result = getSlicedListWithFilters(mockData, Order.asc, "month", false, () => true, 5);
      expect(result).toHaveLength(3);
    });

    it("should return initial list when all items are filtered out", () => {
      const filterFn = (_elem: MarketItemPerformer) => false;
      const result = getSlicedListWithFilters(mockData, Order.asc, "month", true, filterFn, 5);
      expect(result).toHaveLength(mockData.length);
    });
  });
});
