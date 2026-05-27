/**
 * Integration tests for the Filecoin Alpaca API (`createApi`).
 *
 * These tests run against the real Filecoin indexer and require network access.
 * Run with: pnpm test-integ (inside coin-filecoin package)
 */
import { createApi } from "./createApi";

const config = {
  status: { type: "active" as const },
};

const api = createApi(config);

// Well-known Filecoin addresses with activity
const KNOWN_ADDRESS = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
const KNOWN_F4_ADDRESS = "f410fagkr6pfqzd5q2kj42qrj54g3sxqjsrqn4fhoy";

describe("createApi – Filecoin Alpaca integration", () => {
  describe("lastBlock", () => {
    it("returns a block with height > 0, valid hash and recent timestamp", async () => {
      const block = await api.lastBlock();

      expect(block.height).toBeGreaterThan(0);
      expect(block.hash.length).toBeGreaterThan(10);
      expect(block.time).toBeInstanceOf(Date);
      // Block time should be within the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(block.time.getTime()).toBeGreaterThan(oneDayAgo.getTime());
    });
  });

  describe("getBalance", () => {
    it("returns at least one balance entry for a known address", async () => {
      const balances = await api.getBalance(KNOWN_ADDRESS);

      expect(balances.length).toBeGreaterThanOrEqual(1);
      const nativeBalance = balances.find(b => b.asset.type === "native");
      expect(nativeBalance).not.toBeNull();
      expect(typeof nativeBalance?.value).toBe("bigint");
      expect(nativeBalance?.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("listOperations", () => {
    it("returns an array of operations for a known address", async () => {
      const page = await api.listOperations(KNOWN_ADDRESS, { minHeight: 0 });

      expect(Array.isArray(page.items)).toBe(true);
    });

    it("returns well-formed operations when the account has transactions", async () => {
      const page = await api.listOperations(KNOWN_ADDRESS, { minHeight: 0 });
      const op = page.items[0];

      // Skip structural validation if there are no transactions
      if (!op) return;

      expect(typeof op.id).toBe("string");
      expect(op.type).toMatch(/IN|OUT|FEES/);
      expect(typeof op.tx.hash).toBe("string");
      expect(op.tx.block.height).toBeGreaterThan(0);
      expect(op.tx.date).toBeInstanceOf(Date);
      expect(typeof op.value).toBe("bigint");
    });
  });

  describe("getNextSequence", () => {
    it("returns a non-negative bigint nonce for a known address", async () => {
      const nonce = await api.getNextSequence(KNOWN_ADDRESS);

      expect(typeof nonce).toBe("bigint");
      expect(nonce).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("validateAddress", () => {
    it("validates a correct f1 address", async () => {
      expect(await api.validateAddress(KNOWN_ADDRESS, {})).toBe(true);
    });

    it("validates a correct f4 address", async () => {
      expect(await api.validateAddress(KNOWN_F4_ADDRESS, {})).toBe(true);
    });

    it("rejects an invalid address", async () => {
      expect(await api.validateAddress("not-a-valid-address", {})).toBe(false);
    });
  });

  describe("estimateFees", () => {
    it("returns a positive fee value for a native FIL transfer", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: KNOWN_ADDRESS,
        recipient: KNOWN_F4_ADDRESS,
        amount: 1_000_000_000_000_000_000n,
        asset: { type: "native" as const },
      };

      const fee = await api.estimateFees(intent);

      expect(typeof fee.value).toBe("bigint");
      expect(fee.value).toBeGreaterThan(0n);
      expect(fee.parameters).not.toBeNull();
      expect(Number(fee.parameters?.["gasLimit"])).toBeGreaterThan(0);
    });
  });

  describe("craftTransaction", () => {
    it("crafts an unsigned native FIL transaction", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: KNOWN_ADDRESS,
        recipient: KNOWN_F4_ADDRESS,
        amount: 1_000_000_000_000_000_000n,
        asset: { type: "native" as const },
      };

      const crafted = await api.craftTransaction(intent);

      expect(typeof crafted.transaction).toBe("string");
      const parsed = JSON.parse(crafted.transaction);
      expect(typeof parsed.cbor).toBe("string");
      expect(typeof parsed.message.from).toBe("string");
      expect(typeof parsed.message.to).toBe("string");
      expect(parsed.signatureType).toBe(1);
    });
  });

  describe("unsupported methods", () => {
    it("getBlock throws not supported", async () => {
      await expect(api.getBlock(1)).rejects.toThrow("getBlock is not supported");
    });

    it("getBlockInfo throws not supported", async () => {
      await expect(api.getBlockInfo(1)).rejects.toThrow("getBlockInfo is not supported");
    });

    it("getStakes throws not supported", async () => {
      await expect(api.getStakes(KNOWN_ADDRESS)).rejects.toThrow("getStakes is not supported");
    });

    it("getRewards throws not supported", async () => {
      await expect(api.getRewards(KNOWN_ADDRESS)).rejects.toThrow("getRewards is not supported");
    });

    it("getValidators throws not supported", async () => {
      await expect(api.getValidators()).rejects.toThrow("getValidators is not supported");
    });

    it("craftRawTransaction throws not supported", async () => {
      await expect(api.craftRawTransaction("tx", "sender", "pubkey", 0n)).rejects.toThrow(
        "craftRawTransaction is not supported",
      );
    });
  });

  describe("combine + broadcast round-trip (offline)", () => {
    it("combine produces a valid broadcast request JSON from crafted tx + dummy signature", async () => {
      const intent = {
        intentType: "transaction" as const,
        type: "send",
        sender: KNOWN_ADDRESS,
        recipient: KNOWN_F4_ADDRESS,
        amount: 1_000_000_000_000_000_000n,
        asset: { type: "native" as const },
      };

      const crafted = await api.craftTransaction(intent);
      const dummySignature =
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const signed = api.combine(crafted.transaction, dummySignature);

      const parsed = JSON.parse(signed as string);
      expect(typeof parsed.message).toBe("object");
      expect(parsed.signature.data).toBe(dummySignature);
      expect(parsed.signature.type).toBe(1);
    });
  });
});
