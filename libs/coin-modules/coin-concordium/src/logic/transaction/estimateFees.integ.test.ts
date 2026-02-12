import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { encodeMemoToCbor } from "@ledgerhq/hw-app-concordium/lib/cbor";
import coinConfig from "../../config";
import { estimateFees } from "./estimateFees";

describe("estimateFees", () => {
  const currency = getCryptoCurrencyById("concordium");

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
      const result = await estimateFees(currency, TransactionType.Transfer);

      expect(result).toHaveProperty("cost");
      expect(result).toHaveProperty("energy");
      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });

    it("should use default transaction type when not specified", async () => {
      const result = await estimateFees(currency);

      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });

    it("should return consistent results for same transaction type", async () => {
      const result1 = await estimateFees(currency, TransactionType.Transfer);
      const result2 = await estimateFees(currency, TransactionType.Transfer);

      expect(result1.cost).toBe(result2.cost);
      expect(result1.energy).toBe(result2.energy);
    });
  });

  describe("Transfer with memo", () => {
    it("should return higher fee for transfer with memo", async () => {
      const memo = "Test memo";
      const memoSize = encodeMemoToCbor(memo).length;

      const resultWithoutMemo = await estimateFees(currency, TransactionType.Transfer);
      const resultWithMemo = await estimateFees(
        currency,
        TransactionType.TransferWithMemo,
        memoSize,
      );

      expect(resultWithMemo.cost).toBeGreaterThan(resultWithoutMemo.cost);
      expect(resultWithMemo.energy).toBeGreaterThan(resultWithoutMemo.energy);
    });

    it("should scale fee with memo size", async () => {
      const shortMemo = "Hi";
      const longMemo = "This is a longer memo with more characters";

      const shortMemoSize = encodeMemoToCbor(shortMemo).length;
      const longMemoSize = encodeMemoToCbor(longMemo).length;

      const resultShort = await estimateFees(
        currency,
        TransactionType.TransferWithMemo,
        shortMemoSize,
      );
      const resultLong = await estimateFees(
        currency,
        TransactionType.TransferWithMemo,
        longMemoSize,
      );

      expect(resultLong.cost).toBeGreaterThanOrEqual(resultShort.cost);
      expect(resultLong.energy).toBeGreaterThanOrEqual(resultShort.energy);
    });

    it("should handle empty memo", async () => {
      const emptyMemoSize = encodeMemoToCbor("").length;

      const result = await estimateFees(currency, TransactionType.TransferWithMemo, emptyMemoSize);

      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));
    });
  });

  describe("Fee estimation structure", () => {
    it("should return bigint values for precision", async () => {
      const result = await estimateFees(currency, TransactionType.Transfer);

      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
    });

    it("should have reasonable cost values", async () => {
      const result = await estimateFees(currency, TransactionType.Transfer);

      // Cost should be reasonable (not too low, not astronomically high)
      expect(result.cost).toBeGreaterThan(BigInt(100));
      expect(result.cost).toBeLessThan(BigInt(10000000));
    });

    it("should have reasonable energy values", async () => {
      const result = await estimateFees(currency, TransactionType.Transfer);

      // Energy should be reasonable
      expect(result.energy).toBeGreaterThan(BigInt(100));
      expect(result.energy).toBeLessThan(BigInt(10000000));
    });
  });

  describe("Error handling", () => {
    it("should return fallback values on network error", async () => {
      // Using invalid config to trigger fallback
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

      const result = await estimateFees(currency, TransactionType.Transfer);

      // Should still return valid bigint values (fallback)
      expect(typeof result.cost).toBe("bigint");
      expect(typeof result.energy).toBe("bigint");
      expect(result.cost).toBeGreaterThan(BigInt(0));
      expect(result.energy).toBeGreaterThan(BigInt(0));

      // Restore valid config
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
