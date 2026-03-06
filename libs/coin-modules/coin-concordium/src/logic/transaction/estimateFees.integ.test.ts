import coinConfig from "../../config";
import { estimateFees } from "./estimateFees";

describe("estimateFees", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 100000,
    }));
  });

  describe("Simple transfer", () => {
    it("should return fee estimation for simple transfer", async () => {
      const result = await estimateFees("concordium_testnet");

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });

    it("should return consistent results for same parameters", async () => {
      const result1 = await estimateFees("concordium_testnet");
      const result2 = await estimateFees("concordium_testnet");

      expect(result1.cost).toBe(result2.cost);
      expect(result1.energy).toBe(result2.energy);
    });
  });

  describe("Transfer with memo", () => {
    it("should return higher fee for transfer with memo", async () => {
      const memo = "Test memo";

      const resultWithoutMemo = await estimateFees("concordium_testnet");
      const resultWithMemo = await estimateFees("concordium_testnet", memo);

      expect(resultWithMemo.cost).toBeGreaterThan(resultWithoutMemo.cost);
      expect(resultWithMemo.energy).toBeGreaterThan(resultWithoutMemo.energy);
    });

    it("should scale fee with memo size", async () => {
      const shortMemo = "Hi";
      const longMemo = "This is a longer memo with more characters";

      const resultShort = await estimateFees("concordium_testnet", shortMemo);
      const resultLong = await estimateFees("concordium_testnet", longMemo);

      expect(resultLong.cost).toBeGreaterThanOrEqual(resultShort.cost);
      expect(resultLong.energy).toBeGreaterThanOrEqual(resultShort.energy);
    });
  });

  describe("Fee estimation structure", () => {
    it("should return bigint values for precision", async () => {
      const result = await estimateFees("concordium_testnet");

      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
    });

    it("should have reasonable cost values", async () => {
      const result = await estimateFees("concordium_testnet");

      expect(result.cost).toBeGreaterThan(BigInt(100));
      expect(result.cost).toBeLessThan(BigInt(10000000));
    });

    it("should have reasonable energy values", async () => {
      const result = await estimateFees("concordium_testnet");

      expect(result.energy).toBeGreaterThan(BigInt(100));
      expect(result.energy).toBeLessThan(BigInt(10000000));
    });
  });

  describe("Error handling", () => {
    it("should return fallback values on network error", async () => {
      coinConfig.setCoinConfig(() => ({
        status: {
          type: "active",
        },
        networkType: "testnet",
        grpcUrl: "invalid.url",
        grpcPort: 1,
        proxyUrl: "https://invalid-proxy.invalid",
        minReserve: 100000,
      }));

      const result = await estimateFees("concordium_testnet");

      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));

      coinConfig.setCoinConfig(() => ({
        status: {
          type: "active",
        },
        networkType: "testnet",
        grpcUrl: "grpc.testnet.concordium.com",
        grpcPort: 20000,
        proxyUrl: "https://wallet-proxy.testnet.concordium.com",
        minReserve: 100000,
      }));
    });
  });
});
