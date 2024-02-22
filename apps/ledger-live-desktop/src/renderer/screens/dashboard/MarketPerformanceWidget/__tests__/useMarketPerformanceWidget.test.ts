/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from "@jest/globals";
import { getSlicedList } from "../useMarketPerformanceWidget";
import { Order } from "../types";
import { Currency } from "@ledgerhq/types-cryptoassets";

const createElem = (change: number) => ({
  currency: { id: "bitcoin" } as Currency,
  change,
  currentValue: 100,
  referenceValue: 100,
});

describe("useMarketPerformanceWidget", () => {
  describe("getSlicedList", () => {
    it("Should return a list of 4 positive elements sorted", () => {
      const DATA = [
        createElem(-50),
        createElem(10),
        createElem(50),
        createElem(20),
        createElem(30),
      ];

      const list = getSlicedList(DATA, Order.asc);

      expect(list).toHaveLength(4);
      expect(list[0].change).toBe(50);
      expect(list[1].change).toBe(30);
    });

    it("Should return a list of 2 negative elements sorted", () => {
      const DATA = [
        createElem(-20),
        createElem(50),
        createElem(20),
        createElem(-50),
        createElem(30),
      ];

      const list = getSlicedList(DATA, Order.desc);

      expect(list).toHaveLength(2);
      expect(list[0].change).toBe(-50);
      expect(list[1].change).toBe(-20);
    });
  });
});
