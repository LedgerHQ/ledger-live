import { Observable } from "rxjs";
import { take } from "rxjs/operators";
import {
  getCurrentSuiPreloadData,
  setSuiPreloadData,
  getSuiPreloadDataUpdates,
  getPreloadStrategy,
} from "./preload";
import type { SuiPreloadData } from "../types";

// Mock the log function
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("Sui Preload Functions", () => {
  beforeEach(() => {
    // Reset the preload data before each test
    setSuiPreloadData({ validators: [], tokens: [] });
  });

  describe("getCurrentSuiPreloadData", () => {
    it("should return the current preloaded data", () => {
      const testData: SuiPreloadData = { validators: [], tokens: [] };
      setSuiPreloadData(testData);

      const data = getCurrentSuiPreloadData();
      expect(data).toEqual(testData);
    });
  });

  describe("getSuiPreloadDataUpdates", () => {
    it("should return an Observable", () => {
      const updates = getSuiPreloadDataUpdates();
      expect(updates).toBeInstanceOf(Observable);
    });

    it("should emit updates when data is set", done => {
      const testData: SuiPreloadData = { validators: [], tokens: [] };
      const updates = getSuiPreloadDataUpdates();

      updates.pipe(take(1)).subscribe(data => {
        expect(data).toEqual(testData);
        done();
      });

      setSuiPreloadData(testData);
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
  });
});
