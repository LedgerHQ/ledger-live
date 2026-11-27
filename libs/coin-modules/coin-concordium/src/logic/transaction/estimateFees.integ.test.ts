import { concordiumDefaults } from "../../config";
import { estimateFees } from "./estimateFees";
import { createFixtureContext } from "../../test/fixtures";

describe("estimateFees", () => {
  const context = createFixtureContext(concordiumDefaults.concordium_testnet);

  describe("Simple transfer", () => {
    it("should return fee estimation for simple transfer", async () => {
      const result = await estimateFees(context, undefined);

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });

    it("should return consistent results for same parameters", async () => {
      const result1 = await estimateFees(context, undefined);
      const result2 = await estimateFees(context, undefined);

      expect(result1.cost).toBe(result2.cost);
      expect(result1.energy).toBe(result2.energy);
    });
  });

  describe("Transfer with memo", () => {
    it("should return higher fee for transfer with memo", async () => {
      const memo = "Test memo";

      const resultWithoutMemo = await estimateFees(context, undefined);
      const resultWithMemo = await estimateFees(context, memo);

      expect(resultWithMemo.cost).toBeGreaterThan(resultWithoutMemo.cost);
      expect(resultWithMemo.energy).toBeGreaterThan(resultWithoutMemo.energy);
    });

    it("should scale fee with memo size", async () => {
      const shortMemo = "Hi";
      const longMemo = "This is a longer memo with more characters";

      const resultShort = await estimateFees(context, shortMemo);
      const resultLong = await estimateFees(context, longMemo);

      expect(resultLong.cost).toBeGreaterThanOrEqual(resultShort.cost);
      expect(resultLong.energy).toBeGreaterThanOrEqual(resultShort.energy);
    });
  });

  describe("Fee estimation structure", () => {
    it("should return bigint values for precision", async () => {
      const result = await estimateFees(context, undefined);

      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
    });

    it("should have reasonable cost values", async () => {
      const result = await estimateFees(context, undefined);

      expect(result.cost).toBeGreaterThan(BigInt(100));
      expect(result.cost).toBeLessThan(BigInt(10000000));
    });

    it("should have reasonable energy values", async () => {
      const result = await estimateFees(context, undefined);

      expect(result.energy).toBeGreaterThan(BigInt(100));
      expect(result.energy).toBeLessThan(BigInt(10000000));
    });
  });

  describe("Error handling", () => {
    it("should return fallback values on network error", async () => {
      // Use a distinct currencyId to avoid hitting the cached proxyClient
      const invalidConfig = {
        ...concordiumDefaults.concordium_testnet,
        proxyUrl: "https://invalid-proxy.invalid",
      };

      const result = await estimateFees(createFixtureContext(invalidConfig), undefined);

      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });
  });
});
