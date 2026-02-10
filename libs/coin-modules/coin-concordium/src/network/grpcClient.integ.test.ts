import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import { getLastBlock, getBlockInfoByHeight, getBlockByHeight, getOperations } from "./grpcClient";

describe("Concordium gRPC Client", () => {
  let currency: CryptoCurrency;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      status: { type: "active" },
    }));
    currency = getCryptoCurrencyById("concordium");
  });

  describe("getLastBlock", () => {
    it("returns the last finalized block", async () => {
      const result = await getLastBlock(currency);

      expect(result).toBeDefined();
      expect(result.height).toBeGreaterThan(0);
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time.getTime()).toBeGreaterThan(0);
    });

    it("returns increasing block heights on consecutive calls", async () => {
      const first = await getLastBlock(currency);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const second = await getLastBlock(currency);

      expect(second.height).toBeGreaterThanOrEqual(first.height);
    });
  });

  describe("getBlockInfoByHeight", () => {
    it("returns block info for genesis block (height 0)", async () => {
      const result = await getBlockInfoByHeight(currency, 0);

      expect(result).toBeDefined();
      expect(result.height).toBe(0);
      expect(result.hash).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
      expect(result.parent).toBeUndefined();
    });

    it("returns block info with parent for non-genesis blocks", async () => {
      const result = await getBlockInfoByHeight(currency, 10);

      expect(result).toBeDefined();
      expect(result.height).toBe(10);
      expect(result.hash).toBeDefined();
      expect(result.time).toBeInstanceOf(Date);
      expect(result.parent).toBeDefined();
      expect(result.parent!.height).toBe(9);
      expect(result.parent!.hash).toBeDefined();
    });

    it("throws for a height beyond the chain tip", async () => {
      await expect(getBlockInfoByHeight(currency, 999_999_999)).rejects.toThrow();
    });
  });

  describe("getBlockByHeight", () => {
    it("returns a complete block at height 0", async () => {
      const result = await getBlockByHeight(currency, 0);

      expect(result).toBeDefined();
      expect(result.info).toBeDefined();
      expect(result.info.height).toBe(0);
      expect(result.info.hash).toBeDefined();
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.transactions).toBeInstanceOf(Array);
    });

    it("returns a block with proper transaction structure", async () => {
      const lastBlock = await getLastBlock(currency);
      const height = Math.max(lastBlock.height - 5, 1);
      const result = await getBlockByHeight(currency, height);

      expect(result).toBeDefined();
      expect(result.info.height).toBe(height);
      expect(result.transactions).toBeInstanceOf(Array);

      result.transactions.forEach(tx => {
        expect(tx.hash).toBeDefined();
        expect(typeof tx.failed).toBe("boolean");
        expect(tx.operations).toBeInstanceOf(Array);
        expect(typeof tx.fees).toBe("bigint");
        expect(tx.feesPayer).toBeDefined();
      });
    });
  });

  describe("getOperations", () => {
    const ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";

    it("returns operations for an address scanning from a recent height", async () => {
      const lastBlock = await getLastBlock(currency);
      // Scan a very small range to avoid rate limiting
      const startHeight = Math.max(lastBlock.height - 5, 0);

      const [operations, cursor] = await getOperations(currency, ADDRESS, {
        minHeight: startHeight,
        order: "asc",
      });

      expect(operations).toBeInstanceOf(Array);
      expect(typeof cursor).toBe("string");

      operations.forEach(op => {
        expect(op.id).toBeDefined();
        expect(op.asset).toEqual({ type: "native" });
        expect(op.tx.hash).toBeDefined();
        expect(op.tx.date).toBeInstanceOf(Date);
        expect(typeof op.tx.fees).toBe("bigint");
        expect(["IN", "OUT"]).toContain(op.type);
        expect(typeof op.value).toBe("bigint");
      });
    });

    it("returns empty array when scanning beyond chain tip", async () => {
      const [operations] = await getOperations(currency, ADDRESS, {
        minHeight: 999_999_999,
        order: "asc",
      });

      expect(operations).toEqual([]);
    });
  });
});
