import { setupTestnetCoinConfig } from "../test/fixtures";
import { getBlockByHeight } from "./grpcClient";

describe("grpcClient", () => {
  const currencyId = "concordium_testnet";

  // Fixed testnet block heights — avoids coupling to wallet-proxy for height lookup
  const KNOWN_BLOCK_HEIGHT = 1000;

  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  describe("getBlockByHeight", () => {
    it("should return block with transaction info", async () => {
      const result = await getBlockByHeight(currencyId, KNOWN_BLOCK_HEIGHT);

      expect(result.info.height).toBe(KNOWN_BLOCK_HEIGHT);
      expect(result.info.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.transactions).toBeInstanceOf(Array);
    });

    it("should return transactions with valid structure", async () => {
      const result = await getBlockByHeight(currencyId, KNOWN_BLOCK_HEIGHT);

      result.transactions.forEach(tx => {
        expect(tx).toHaveProperty("hash");
        expect(tx).toHaveProperty("fees");
        expect(tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(typeof tx.fees).toBe("bigint");
        expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
      });
    });

    it("should return consistent block data", async () => {
      const result1 = await getBlockByHeight(currencyId, KNOWN_BLOCK_HEIGHT);
      const result2 = await getBlockByHeight(currencyId, KNOWN_BLOCK_HEIGHT);

      expect(result1.info.height).toBe(result2.info.height);
      expect(result1.info.hash).toBe(result2.info.hash);
      expect(result1.transactions.length).toBe(result2.transactions.length);
    });
  });

  describe("Network connectivity", () => {
    it("should successfully connect to gRPC endpoint", async () => {
      const result = await getBlockByHeight(currencyId, 1);
      expect(result.info.height).toBe(1);
    });

    it("should handle multiple concurrent requests", async () => {
      const promises = [
        getBlockByHeight(currencyId, 1),
        getBlockByHeight(currencyId, 2),
        getBlockByHeight(currencyId, 3),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.info.height).toBeGreaterThan(0);
        expect(result.info.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      });
    });
  });
});
