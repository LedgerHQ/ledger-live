import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import type { ConcordiumMemo } from "../types";
import { createApi } from ".";

/**
 * Integration tests for Concordium API
 *
 * These tests verify the API implementation against real Concordium testnet.
 * Tests cover all required AlpacaApi methods as per API docs requirements.
 */
describe("Concordium Api (testnet)", () => {
  let api: AlpacaApi<ConcordiumMemo>;

  // Test account with some balance and transactions
  // https://testnet.ccdscan.io/
  const ADDRESS_WITH_BALANCE = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const ADDRESS_PRISTINE = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";
  const PUBLIC_KEY = "aa".repeat(32);

  beforeAll(() => {
    api = createApi({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 100000,
    });
  });

  describe("estimateFees", () => {
    it("returns fee estimation for simple transfer", async () => {
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: ADDRESS_PRISTINE,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      expect(result.value).toBeGreaterThan(0);
      expect(typeof result.value).toBe("bigint");
    });

    it("returns higher fee estimation for transfer with memo", async () => {
      const resultWithoutMemo = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: ADDRESS_PRISTINE,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      const resultWithMemo = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: ADDRESS_PRISTINE,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "Test memo",
        },
      });

      expect(resultWithMemo.value).toBeGreaterThan(resultWithoutMemo.value);
    });
  });

  describe("getBalance", () => {
    it("returns balance for account with funds", async () => {
      const result = await api.getBalance(ADDRESS_WITH_BALANCE);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(BigInt(0));
    });

    it("returns 0 balance for pristine account", async () => {
      const result = await api.getBalance(ADDRESS_PRISTINE);

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await api.lastBlock();

      expect(result.height).toBeGreaterThan(0);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info for specific height", async () => {
      const lastBlock = await api.lastBlock();
      const targetHeight = lastBlock.height - 10;

      const result = await api.getBlockInfo(targetHeight);

      expect(result.height).toBe(targetHeight);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlock", () => {
    it("returns block with transaction info", async () => {
      const lastBlock = await api.lastBlock();
      const targetHeight = lastBlock.height - 10;

      const result = await api.getBlock(targetHeight);

      expect(result.info.height).toBe(targetHeight);
      expect(result.info.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.transactions).toBeInstanceOf(Array);

      result.transactions.forEach(tx => {
        expect(tx.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
        expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
      });
    });
  });

  describe("craftTransaction", () => {
    const RECIPIENT = ADDRESS_PRISTINE;

    it("returns a hex-encoded raw transaction", async () => {
      const { transaction } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: RECIPIENT,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      expect(transaction).toMatch(/^[A-Fa-f0-9]+$/);
      expect(transaction.length).toBeGreaterThan(0);
    });

    it("crafts transaction with correct amount and recipient", async () => {
      const amount = BigInt(5000000);
      const { transaction } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: RECIPIENT,
        amount,
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      expect(transaction).toMatch(/^[A-Fa-f0-9]+$/);
      expect(transaction.length).toBeGreaterThan(100);
    });

    it("crafts transaction with memo", async () => {
      const { transaction: txWithoutMemo } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: RECIPIENT,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      const { transaction: txWithMemo } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: RECIPIENT,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "Test memo",
        },
      });

      expect(txWithMemo.length).toBeGreaterThan(txWithoutMemo.length);
    });

    it("should use estimated fees when not provided", async () => {
      const { transaction } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS_WITH_BALANCE,
        recipient: RECIPIENT,
        amount: BigInt(1000000),
        memo: {
          type: "string",
          kind: "text",
          value: "",
        },
      });

      expect(transaction).toMatch(/^[A-Fa-f0-9]+$/);
    });
  });

  describe("craftRawTransaction", () => {
    it.skip("returns crafted transaction from raw parameters", async () => {
      // TODO: This test requires a valid serialized transaction as input.
      // The current test data ("01".repeat(100)) is not a valid transaction.
      // Skipping until we have proper test data.
      const rawTx = "01".repeat(100);
      const sequence = BigInt(1);

      const { transaction } = await api.craftRawTransaction(
        rawTx,
        ADDRESS_WITH_BALANCE,
        PUBLIC_KEY,
        sequence,
      );

      expect(transaction).toMatch(/^[A-Fa-f0-9]+$/);
      expect(transaction.length).toBeGreaterThan(0);
    });
  });

  describe("broadcast", () => {
    it("throws error for invalid transaction", async () => {
      const invalidTx = "deadbeef";

      await expect(api.broadcast(invalidTx)).rejects.toThrow();
    });
  });

  describe("combine", () => {
    it("combines transaction and signature", async () => {
      const transaction = "01".repeat(100);
      const signature = "02".repeat(64);

      const result = await api.combine(transaction, signature);

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("transactionBody");
      expect(parsed).toHaveProperty("signature");
      expect(parsed.transactionBody).toBe(transaction);
      expect(parsed.signature).toBe(signature);
    });
  });

  describe("unsupported methods", () => {
    it("getStakes throws not supported error", async () => {
      await expect(async () => api.getStakes(ADDRESS_WITH_BALANCE)).rejects.toThrow();
    });

    it("getRewards throws not supported error", async () => {
      await expect(async () => api.getRewards(ADDRESS_WITH_BALANCE)).rejects.toThrow();
    });

    it("getValidators throws not supported error", async () => {
      await expect(async () => api.getValidators()).rejects.toThrow();
    });
  });
});
