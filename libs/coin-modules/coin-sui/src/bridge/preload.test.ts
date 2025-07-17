import { Observable } from "rxjs";
import { take } from "rxjs/operators";
import {
  getCurrentSuiPreloadData,
  setSuiPreloadData,
  getSuiPreloadDataUpdates,
  getPreloadStrategy,
  preload,
  hydrate,
} from "./preload";
import type { SuiPreloadData } from "../types";

// Mock the log function
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("Sui Preload Functions", () => {
  beforeEach(() => {
    // Reset the preload data before each test
    setSuiPreloadData({});
  });

  describe("getCurrentSuiPreloadData", () => {
    it("should return empty object by default", () => {
      const data = getCurrentSuiPreloadData();
      expect(data).toEqual({});
    });

    it("should return the current preloaded data", () => {
      const testData: SuiPreloadData = { testKey: "testValue" };
      setSuiPreloadData(testData);

      const data = getCurrentSuiPreloadData();
      expect(data).toEqual(testData);
    });
  });

  describe("setSuiPreloadData", () => {
    it("should set the preload data", () => {
      const testData: SuiPreloadData = { key1: "value1", key2: "value2" };

      setSuiPreloadData(testData);

      const currentData = getCurrentSuiPreloadData();
      expect(currentData).toEqual(testData);
    });

    it("should not update if data is the same reference", () => {
      const testData: SuiPreloadData = { test: "data" };

      // Set data first time
      setSuiPreloadData(testData);
      const firstCall = getCurrentSuiPreloadData();

      // Set the same data reference
      setSuiPreloadData(testData);
      const secondCall = getCurrentSuiPreloadData();

      expect(firstCall).toBe(secondCall);
      expect(firstCall).toEqual(testData);
    });

    it("should update if data has different content", () => {
      const firstData: SuiPreloadData = { test: "first" };
      const secondData: SuiPreloadData = { test: "second" };

      setSuiPreloadData(firstData);
      const firstCall = getCurrentSuiPreloadData();

      setSuiPreloadData(secondData);
      const secondCall = getCurrentSuiPreloadData();

      expect(firstCall).not.toBe(secondCall);
      expect(secondCall).toEqual(secondData);
    });
  });

  describe("getSuiPreloadDataUpdates", () => {
    it("should return an Observable", () => {
      const updates = getSuiPreloadDataUpdates();
      expect(updates).toBeInstanceOf(Observable);
    });

    it("should emit updates when data is set", done => {
      const testData: SuiPreloadData = { update: "test" };
      const updates = getSuiPreloadDataUpdates();

      updates.pipe(take(1)).subscribe(data => {
        expect(data).toEqual(testData);
        done();
      });

      setSuiPreloadData(testData);
    });

    it("should emit multiple updates", done => {
      const firstData: SuiPreloadData = { first: "data" };
      const secondData: SuiPreloadData = { second: "data" };
      const updates = getSuiPreloadDataUpdates();

      let callCount = 0;
      updates.pipe(take(2)).subscribe(data => {
        callCount++;
        if (callCount === 1) {
          expect(data).toEqual(firstData);
        } else if (callCount === 2) {
          expect(data).toEqual(secondData);
          done();
        }
      });

      setSuiPreloadData(firstData);
      setSuiPreloadData(secondData);
    });

    it("should not emit when same data reference is set", done => {
      const testData: SuiPreloadData = { test: "data" };
      const updates = getSuiPreloadDataUpdates();

      let callCount = 0;
      updates.pipe(take(1)).subscribe(data => {
        callCount++;
        expect(data).toEqual(testData);
        // Wait a bit to ensure no additional emissions
        setTimeout(() => {
          expect(callCount).toBe(1);
          done();
        }, 10);
      });

      setSuiPreloadData(testData);
      setSuiPreloadData(testData); // Same reference, should not emit
    });
  });

  describe("getPreloadStrategy", () => {
    it("should return preload strategy with correct max age", () => {
      const strategy = getPreloadStrategy();

      expect(strategy).toHaveProperty("preloadMaxAge");
      expect(strategy.preloadMaxAge).toBe(30 * 60 * 1000); // 30 minutes in milliseconds
    });

    it("should return consistent strategy object", () => {
      const strategy1 = getPreloadStrategy();
      const strategy2 = getPreloadStrategy();

      expect(strategy1).toEqual(strategy2);
      expect(strategy1.preloadMaxAge).toBe(30 * 60 * 1000);
    });
  });

  describe("preload", () => {
    it("should return empty object", async () => {
      const result = await preload();
      expect(result).toEqual({});
    });

    it("should log preload message", async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { log } = require("@ledgerhq/logs");

      await preload();

      expect(log).toHaveBeenCalledWith("sui/preload", "preloading sui data...");
    });

    it("should always return the same result", async () => {
      const result1 = await preload();
      const result2 = await preload();

      expect(result1).toEqual(result2);
      expect(result1).toEqual({});
    });
  });

  describe("hydrate", () => {
    it("should set preload data with hydrated data", () => {
      const testData: SuiPreloadData = { hydrate: "test" };

      hydrate(testData);

      const currentData = getCurrentSuiPreloadData();
      expect(currentData).toEqual({}); // fromHydratePreloadData returns empty object
    });

    it("should emit update when hydrated", done => {
      const testData: SuiPreloadData = { hydrate: "test" };
      const updates = getSuiPreloadDataUpdates();

      updates.pipe(take(1)).subscribe(data => {
        expect(data).toEqual({}); // fromHydratePreloadData returns empty object
        done();
      });

      hydrate(testData);
    });

    it("should handle empty data", () => {
      const emptyData: SuiPreloadData = {};

      hydrate(emptyData);

      const currentData = getCurrentSuiPreloadData();
      expect(currentData).toEqual({});
    });

    it("should handle complex data structures", () => {
      const complexData: SuiPreloadData = {
        nested: { key: "value" },
        array: [1, 2, 3],
        boolean: true,
        number: 42,
      };

      hydrate(complexData);

      const currentData = getCurrentSuiPreloadData();
      expect(currentData).toEqual({}); // fromHydratePreloadData returns empty object
    });
  });

  describe("Integration Tests", () => {
    it("should maintain data consistency across multiple operations", () => {
      const testData: SuiPreloadData = { integration: "test" };

      // Set data
      setSuiPreloadData(testData);
      expect(getCurrentSuiPreloadData()).toEqual(testData);

      // Hydrate should override
      hydrate({ different: "data" });
      expect(getCurrentSuiPreloadData()).toEqual({});

      // Set again
      setSuiPreloadData(testData);
      expect(getCurrentSuiPreloadData()).toEqual(testData);
    });

    it("should handle rapid successive updates", done => {
      const updates = getSuiPreloadDataUpdates();
      const results: SuiPreloadData[] = [];

      updates.pipe(take(3)).subscribe(data => {
        results.push(data);
        if (results.length === 3) {
          expect(results).toEqual([{ first: "update" }, { second: "update" }, { third: "update" }]);
          done();
        }
      });

      setSuiPreloadData({ first: "update" });
      setSuiPreloadData({ second: "update" });
      setSuiPreloadData({ third: "update" });
    });

    it("should work with preload strategy", async () => {
      const strategy = getPreloadStrategy();
      const preloadResult = await preload();

      expect(strategy.preloadMaxAge).toBe(30 * 60 * 1000);
      expect(preloadResult).toEqual({});

      // Preload should not affect current data
      expect(getCurrentSuiPreloadData()).toEqual({});
    });
  });

  describe("Edge Cases", () => {
    it("should handle null data gracefully", () => {
      // TypeScript would prevent this, but testing runtime behavior
      const nullData = null as any;

      expect(() => {
        setSuiPreloadData(nullData);
      }).not.toThrow();
    });

    it("should handle undefined data gracefully", () => {
      // TypeScript would prevent this, but testing runtime behavior
      const undefinedData = undefined as any;

      expect(() => {
        setSuiPreloadData(undefinedData);
      }).not.toThrow();
    });

    it("should handle multiple subscribers", done => {
      const updates1 = getSuiPreloadDataUpdates();
      const updates2 = getSuiPreloadDataUpdates();

      let subscriber1Called = false;
      let subscriber2Called = false;

      updates1.pipe(take(1)).subscribe(() => {
        subscriber1Called = true;
        if (subscriber1Called && subscriber2Called) {
          done();
        }
      });

      updates2.pipe(take(1)).subscribe(() => {
        subscriber2Called = true;
        if (subscriber1Called && subscriber2Called) {
          done();
        }
      });

      setSuiPreloadData({ multi: "subscriber" });
    });

    it("should handle unsubscribe scenarios", done => {
      const updates = getSuiPreloadDataUpdates();
      let callCount = 0;

      const subscription = updates.subscribe(() => {
        callCount++;
      });

      setSuiPreloadData({ first: "update" });

      subscription.unsubscribe();

      setSuiPreloadData({ second: "update" });

      setTimeout(() => {
        expect(callCount).toBe(1); // Should only receive first update
        done();
      }, 10);
    });
  });
});
