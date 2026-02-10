import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import coinConfig from "../config";
import { getLastBlock, getBlockInfoByHeight, getBlockByHeight } from "./grpcClient";

describe("grpcClient", () => {
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

  describe("getLastBlock", () => {
    it("should return last block info", async () => {
      const result = await getLastBlock(currency);

      expect(result).toHaveProperty("height");
      expect(result).toHaveProperty("hash");
      expect(result).toHaveProperty("time");
      expect(result.height).toBeGreaterThan(0);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });

    it("should return increasing block height on subsequent calls", async () => {
      const result1 = await getLastBlock(currency);
      // Wait a bit for potential new block
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result2 = await getLastBlock(currency);

      expect(result2.height).toBeGreaterThanOrEqual(result1.height);
    });
  });

  describe("getBlockInfoByHeight", () => {
    it("should return block info for specific height", async () => {
      const lastBlock = await getLastBlock(currency);
      const targetHeight = lastBlock.height - 10;

      const result = await getBlockInfoByHeight(currency, targetHeight);

      expect(result.height).toBe(targetHeight);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });

    it("should return consistent info for same height", async () => {
      const lastBlock = await getLastBlock(currency);
      const targetHeight = lastBlock.height - 10;

      const result1 = await getBlockInfoByHeight(currency, targetHeight);
      const result2 = await getBlockInfoByHeight(currency, targetHeight);

      expect(result1.height).toBe(result2.height);
      expect(result1.hash).toBe(result2.hash);
      expect(result1.time.getTime()).toBe(result2.time.getTime());
    });

    it("should handle recent blocks", async () => {
      const lastBlock = await getLastBlock(currency);
      const recentHeight = lastBlock.height - 1;

      const result = await getBlockInfoByHeight(currency, recentHeight);

      expect(result.height).toBe(recentHeight);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
    });
  });

  describe("getBlockByHeight", () => {
    it("should return block with transaction info", async () => {
      const lastBlock = await getLastBlock(currency);
      const targetHeight = lastBlock.height - 10;

      const result = await getBlockByHeight(currency, targetHeight);

      expect(result.info.height).toBe(targetHeight);
      expect(result.info.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.transactions).toBeInstanceOf(Array);
    });

    it("should return transactions with valid structure", async () => {
      const lastBlock = await getLastBlock(currency);
      const targetHeight = lastBlock.height - 10;

      const result = await getBlockByHeight(currency, targetHeight);

      result.transactions.forEach(tx => {
        expect(tx).toHaveProperty("hash");
        expect(tx).toHaveProperty("fees");
        expect(tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(typeof tx.fees).toBe("bigint");
        expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
      });
    });

    it("should return consistent block data", async () => {
      const lastBlock = await getLastBlock(currency);
      const targetHeight = lastBlock.height - 10;

      const result1 = await getBlockByHeight(currency, targetHeight);
      const result2 = await getBlockByHeight(currency, targetHeight);

      expect(result1.info.height).toBe(result2.info.height);
      expect(result1.info.hash).toBe(result2.info.hash);
      expect(result1.transactions.length).toBe(result2.transactions.length);
    });
  });

  describe("Network connectivity", () => {
    it("should successfully connect to gRPC endpoint", async () => {
      // This test verifies the gRPC connection works
      const result = await getLastBlock(currency);
      expect(result.height).toBeGreaterThan(0);
    });

    it("should handle multiple concurrent requests", async () => {
      const promises = [getLastBlock(currency), getLastBlock(currency), getLastBlock(currency)];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.height).toBeGreaterThan(0);
        expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      });
    });
  });
});
