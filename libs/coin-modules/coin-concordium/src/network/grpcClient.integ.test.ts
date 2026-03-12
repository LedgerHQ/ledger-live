import { setupTestnetCoinConfig } from "../test/fixtures";
import { getBlockInfoByHeight, getBlockByHeight } from "./grpcClient";

describe("grpcClient", () => {
  const currencyId = "concordium_testnet";

  // Fixed testnet block heights — avoids coupling to wallet-proxy for height lookup
  const KNOWN_BLOCK_HEIGHT = 1000;

  beforeAll(() => {
    setupTestnetCoinConfig();
  });

  describe("getBlockInfoByHeight", () => {
    it("should return block info for specific height", async () => {
      const result = await getBlockInfoByHeight(currencyId, KNOWN_BLOCK_HEIGHT);

      expect(result.height).toBe(KNOWN_BLOCK_HEIGHT);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });

    it("should return consistent info for same height", async () => {
      const result1 = await getBlockInfoByHeight(currencyId, KNOWN_BLOCK_HEIGHT);
      const result2 = await getBlockInfoByHeight(currencyId, KNOWN_BLOCK_HEIGHT);

      expect(result1.height).toBe(result2.height);
      expect(result1.hash).toBe(result2.hash);
      expect(result1.time.getTime()).toBe(result2.time.getTime());
    });

    it("should handle early block", async () => {
      const result = await getBlockInfoByHeight(currencyId, 1);

      expect(result.height).toBe(1);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    });
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
      const result = await getBlockInfoByHeight(currencyId, 1);
      expect(result.height).toBe(1);
    });

    it("should handle multiple concurrent requests", async () => {
      const promises = [
        getBlockInfoByHeight(currencyId, 1),
        getBlockInfoByHeight(currencyId, 2),
        getBlockInfoByHeight(currencyId, 3),
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.height).toBeGreaterThan(0);
        expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      });
    });
  });
});
