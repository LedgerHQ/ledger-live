import { getPreloadStrategy } from "./preload";

// Mock the log function
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));

describe("Sui Preload Functions", () => {
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
