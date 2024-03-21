/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from "@jest/globals";
import { getSlicedList } from "../useMarketPerformanceWidget";
import { Order } from "../types";
import { MarketPerformersResult } from "@ledgerhq/live-common/market/types";

const createElem = (change: number): MarketPerformersResult => ({
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

    it("Should return a list of 2 negative elements sorted", () => {
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

    it("Should return a list of32 negative elements on week", () => {
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
});
