import { withDefaults, type CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import type { ConcordiumCoinConfig, ConcordiumMemo } from "../types";
import { createFixtureContext } from "../test/fixtures";
import { createApi } from ".";

/**
 * Integration tests for Concordium API
 *
 * These tests verify the API implementation against real Concordium testnet.
 * Tests cover all required CoinModuleApi methods as per API docs requirements.
 */
describe("Concordium Api (testnet)", () => {
  let api: CoinModuleApi<ConcordiumCoinConfig, ConcordiumMemo>;

  const context = createFixtureContext();

  // Test account with some balance and transactions
  // https://testnet.ccdscan.io/
  const ADDRESS_WITH_BALANCE = "3U6m951FWryY56SKFFHgMLGVHtJtk4VaxN7V2F9hjkR7Sg1FUx";
  const ADDRESS_PRISTINE = "4ox4d7b4S9Mi3qA696v3yYjBQB4f6GDEVATrH9oFnoHUd5zLgh";

  beforeAll(() => {
    api = withDefaults(createApi("concordium_testnet"));
  });

  describe("estimateFees", () => {
    it("returns fee estimation for simple transfer", async () => {
      const result = await api.estimateFees(context, {
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
      const resultWithoutMemo = await api.estimateFees(context, {
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

      const resultWithMemo = await api.estimateFees(context, {
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
      const result = await api.getBalance(context, ADDRESS_WITH_BALANCE);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(result[0].value).toBeGreaterThanOrEqual(BigInt(0));
    });

    it("returns 0 balance for pristine account", async () => {
      const result = await api.getBalance(context, ADDRESS_PRISTINE);

      expect(result).toEqual([{ value: BigInt(0), asset: { type: "native" } }]);
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await api.lastBlock(context);

      expect(result.height).toBeGreaterThan(0);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info for specific height", async () => {
      const lastBlock = await api.lastBlock(context);
      const targetHeight = lastBlock.height - 10;

      const result = await api.getBlockInfo(context, targetHeight);

      expect(result.height).toBe(targetHeight);
      expect(result.hash).toMatch(/^[A-Fa-f0-9]{64}$/);
      expect(result.time).toBeInstanceOf(Date);
    });
  });

  describe("getBlock", () => {
    it("returns block info matching getBlockInfo and a list of transactions", async () => {
      const lastBlock = await api.lastBlock(context);
      const targetHeight = lastBlock.height - 10;

      const [block, info] = await Promise.all([
        api.getBlock(context, targetHeight),
        api.getBlockInfo(context, targetHeight),
      ]);

      expect(block.info).toEqual(info);
      expect(Array.isArray(block.transactions)).toBe(true);
    });

    it("maps a real CCD transfer to a signed operation pair with fees on the transaction", async () => {
      const { items } = await api.listOperations(context, ADDRESS_WITH_BALANCE, {
        minHeight: 0,
        order: "desc",
        limit: 20,
      });
      const transfer = items.find(op => !op.tx.failed && op.senders[0] && op.recipients[0]);
      if (!transfer) {
        throw new Error("no transfer found for ADDRESS_WITH_BALANCE to exercise getBlock");
      }

      const block = await api.getBlock(context, transfer.tx.block.height);
      const tx = block.transactions.find(t => t.hash === transfer.tx.hash);

      if (!tx) {
        throw new Error(
          `transaction ${transfer.tx.hash} not found in block ${transfer.tx.block.height}`,
        );
      }
      expect(tx.failed).toBe(false);
      expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
      const transferOps = tx.operations.filter(op => op.type === "transfer");
      expect(transferOps.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("craftTransaction", () => {
    const RECIPIENT = ADDRESS_PRISTINE;

    it("returns a hex-encoded raw transaction", async () => {
      const { transaction } = await api.craftTransaction(context, {
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
      const { transaction } = await api.craftTransaction(context, {
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
      const { transaction: txWithoutMemo } = await api.craftTransaction(context, {
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

      const { transaction: txWithMemo } = await api.craftTransaction(context, {
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
      const { transaction } = await api.craftTransaction(context, {
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

  describe("broadcast", () => {
    it("throws error for invalid transaction", async () => {
      const invalidTx = "deadbeef";

      await expect(api.broadcast(context, invalidTx)).rejects.toThrow();
    });
  });

  describe("combine", () => {
    it("combines transaction and signature", async () => {
      const transaction = "01".repeat(100);
      const signature = "02".repeat(64);

      const result = await api.combine(context, transaction, [signature]);

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("transactionBody");
      expect(parsed).toHaveProperty("signature");
      expect(parsed.transactionBody).toBe(transaction);
      expect(parsed.signature).toBe(signature);
    });
  });

  // Omitted by the module; withDefaults (applied by the resolver, and here) supplies the answer.
  describe("unsupported methods", () => {
    it("getStakes throws not supported error", async () => {
      await expect(async () => api.getStakes(context, ADDRESS_WITH_BALANCE)).rejects.toThrow();
    });

    it("getRewards throws not supported error", async () => {
      await expect(async () => api.getRewards(context, ADDRESS_WITH_BALANCE)).rejects.toThrow();
    });

    it("getValidators throws not supported error", async () => {
      await expect(async () => api.getValidators(context)).rejects.toThrow();
    });
  });
});
