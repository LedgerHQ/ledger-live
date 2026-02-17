import type { SuiPreloadData } from "../types";
import { getCurrentSuiPreloadData, setSuiPreloadData } from "./preload-data";

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
});
