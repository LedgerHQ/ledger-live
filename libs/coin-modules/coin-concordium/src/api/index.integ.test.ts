import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import type { ConcordiumMemo } from "../types";
import { createApi } from ".";

// Concordium block/transaction hashes are 32 bytes = 64 hex characters
const HASH_LENGTH = 64;

describe("Concordium Api", () => {
  let api: AlpacaApi<ConcordiumMemo>;

  // Known testnet foundation address with transaction history
  const ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";
  const RECIPIENT = "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w";
  // Valid testnet address with zero balance and no transaction history (pristine)
  const PRISTINE_ADDRESS = RECIPIENT;

  beforeAll(() => {
    api = createApi({
      networkType: "testnet",
      grpcUrl: "grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
    });
  });

  describe("estimateFees", () => {
    it("returns a fee estimation for a simple transfer", async () => {
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: BigInt(1_000_000),
      });

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThan(BigInt(0));
    });

    it("returns a fee estimation for a transfer with memo", async () => {
      const result = await api.estimateFees({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: BigInt(1_000_000),
        memo: { type: "string", value: "test memo" },
      });

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThan(BigInt(0));
    });

    it("transfer with memo costs more than simple transfer", async () => {
      const intent = {
        intentType: "transaction" as const,
        asset: { type: "native" as const },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: BigInt(1_000_000),
      };

      const simpleFees = await api.estimateFees(intent);
      const memoFees = await api.estimateFees({
        ...intent,
        memo: { type: "string" as const, value: "a longer memo for testing purposes" },
      });

      expect(memoFees.value).toBeGreaterThan(simpleFees.value);
    });
  });

  describe("getBalance", () => {
    it("returns a balance higher than 0 for an account with balance", async () => {
      const result = await api.getBalance(ADDRESS);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(typeof result[0].value).toBe("bigint");
      expect(result[0].value).toBeGreaterThan(BigInt(0));
    });

    it("returns a balance of 0 for a pristine account", async () => {
      const result = await api.getBalance(PRISTINE_ADDRESS);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].asset).toEqual({ type: "native" });
      expect(typeof result[0].value).toBe("bigint");
      expect(result[0].value).toBe(BigInt(0));
    });
  });

  describe("lastBlock", () => {
    it("returns last block info", async () => {
      const result = await api.lastBlock();

      expect(result.hash).toBeDefined();
      expect(result.hash).toHaveLength(HASH_LENGTH);
      expect(result.height).toBeGreaterThan(0);
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time.getTime()).toBeGreaterThan(0);
    });
  });

  describe("listOperations", () => {
    it("returns at least 1 operation for a standard account", async () => {
      const [operations] = await api.listOperations(ADDRESS, { minHeight: 0, order: "desc" });

      expect(operations.length).toBeGreaterThanOrEqual(1);
      operations.forEach(operation => {
        expect(operation.tx.hash).toBeDefined();
        expect(operation.tx.hash.length).toBeGreaterThan(0);
        expect(operation.tx.date).toBeInstanceOf(Date);
        expect(["IN", "OUT"]).toContain(operation.type);
        expect(typeof operation.value).toBe("bigint");
        expect(operation.senders.length).toBeGreaterThanOrEqual(1);
        expect(operation.recipients.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("returns an empty array for a pristine account", async () => {
      const [operations] = await api.listOperations(PRISTINE_ADDRESS, {
        minHeight: 0,
        order: "desc",
      });

      expect(operations).toEqual([]);
    });
  });

  describe("craftTransaction", () => {
    const AMOUNT = BigInt(1_000_000);

    it("crafts a tx with corresponding amount and recipient", async () => {
      const { transaction } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      });

      expect(transaction).toBeDefined();
      expect(transaction.length).toBeGreaterThan(0);
      expect(transaction).toMatch(/^[0-9a-f]+$/);
      // Verify the serialized transaction embeds the amount (1000000 = 0xF4240)
      expect(transaction).toContain("0f4240");
    });

    it("crafts a tx with memo containing amount and recipient", async () => {
      const { transaction } = await api.craftTransaction({
        intentType: "transaction",
        asset: { type: "native" },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
        memo: { type: "string", value: "test memo" },
      });

      expect(transaction).toBeDefined();
      expect(transaction.length).toBeGreaterThan(0);
      expect(transaction).toMatch(/^[0-9a-f]+$/);
      // Verify the serialized transaction embeds the amount (1000000 = 0xF4240)
      expect(transaction).toContain("0f4240");
    });

    it("different amounts produce different serialized transactions", async () => {
      const intent = {
        intentType: "transaction" as const,
        asset: { type: "native" as const },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      };

      const { transaction: tx1 } = await api.craftTransaction(intent);
      const { transaction: tx2 } = await api.craftTransaction({
        ...intent,
        amount: BigInt(2_000_000),
      });

      expect(tx1).not.toBe(tx2);
    });

    it("transfer with memo produces a longer serialized transaction", async () => {
      const intent = {
        intentType: "transaction" as const,
        asset: { type: "native" as const },
        type: "send",
        sender: ADDRESS,
        recipient: RECIPIENT,
        amount: AMOUNT,
      };

      const { transaction: simpleTx } = await api.craftTransaction(intent);
      const { transaction: memoTx } = await api.craftTransaction({
        ...intent,
        memo: { type: "string" as const, value: "memo data" },
      });

      expect(memoTx.length).toBeGreaterThan(simpleTx.length);
    });
  });

  describe("combine", () => {
    it("returns a JSON string with transaction and signature", () => {
      const transaction = "aabbccdd";
      const signature = "11223344";

      const result = api.combine(transaction, signature);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty("transactionBody", transaction);
      expect(parsed).toHaveProperty("signature", signature);
    });
  });

  describe("getBlock", () => {
    it("returns a block with correct info at a given height", async () => {
      const height = 1;
      const result = await api.getBlock(height);

      expect(result).toBeDefined();
      expect(result.info).toBeDefined();
      expect(result.info.height).toBe(height);
      expect(result.info.hash).toHaveLength(HASH_LENGTH);
      expect(result.info.time).toBeInstanceOf(Date);
      expect(result.info.time.getTime()).toBeGreaterThan(0);
      expect(result.transactions).toBeInstanceOf(Array);
    });

    it("returns transactions with hash and fees when present", async () => {
      // Use a recent block that is more likely to contain transactions
      const lastBlockInfo = await api.lastBlock();
      const height = Math.max(lastBlockInfo.height - 10, 1);
      const result = await api.getBlock(height);

      expect(result.info.height).toBe(height);
      expect(result.transactions).toBeInstanceOf(Array);

      result.transactions.forEach(tx => {
        expect(tx.hash).toBeDefined();
        expect(tx.hash.length).toBeGreaterThan(0);
        expect(typeof tx.fees).toBe("bigint");
        expect(tx.fees).toBeGreaterThanOrEqual(BigInt(0));
        expect(tx.feesPayer).toBeDefined();
        expect(typeof tx.failed).toBe("boolean");
        expect(tx.operations).toBeInstanceOf(Array);
      });
    });
  });

  describe("getBlockInfo", () => {
    it("returns block info at a given height", async () => {
      const result = await api.getBlockInfo(1);

      expect(result).toBeDefined();
      expect(result.height).toBe(1);
      expect(result.hash).toHaveLength(HASH_LENGTH);
      expect(result.time).toBeInstanceOf(Date);
      expect(result.time.getTime()).toBeGreaterThan(0);
    });

    it("includes parent block reference for non-genesis blocks", async () => {
      const result = await api.getBlockInfo(2);

      expect(result.parent).toBeDefined();
      expect(result.parent!.height).toBe(1);
      expect(result.parent!.hash).toHaveLength(HASH_LENGTH);
    });
  });

  describe("unsupported methods", () => {
    it("getStakes throws not supported", () => {
      expect(() => api.getStakes(ADDRESS)).toThrow("not supported");
    });

    it("getRewards throws not supported", () => {
      expect(() => api.getRewards(ADDRESS)).toThrow("not supported");
    });

    it("getValidators throws not supported", () => {
      expect(() => api.getValidators()).toThrow("not supported");
    });
  });
});
