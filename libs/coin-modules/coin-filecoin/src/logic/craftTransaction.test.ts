import { craftTransaction } from "./craftTransaction";
import type { CraftTransactionInput } from "../types/model";

// Valid test addresses
const VALID_SENDER = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
const VALID_RECIPIENT = "f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za";
const VALID_ETH_RECIPIENT = "0x1234567890123456789012345678901234567890";
const VALID_CONTRACT = "0xabcdef1234567890abcdef1234567890abcdef12";

describe("craftTransaction", () => {
  describe("native transfers", () => {
    it("should craft a native FIL transfer", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 5,
        gasFeeCap: 100000n,
        gasPremium: 50000n,
        gasLimit: 1000000n,
      };

      const result = await craftTransaction(input);

      expect(result.transaction).toBeDefined();
      expect(result.details).toBeDefined();

      // Parse and verify transaction content
      const parsed = JSON.parse(result.transaction);
      expect(parsed.txPayload).toBeDefined();
      expect(parsed.details.nonce).toBe(5);
      expect(parsed.details.method).toBe(0); // Transfer
    });

    it("should include gas parameters in details", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 10,
        gasFeeCap: 200000n,
        gasPremium: 100000n,
        gasLimit: 2000000n,
      };

      const result = await craftTransaction(input);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.details.gasFeeCap).toBe("200000");
      expect(parsed.details.gasPremium).toBe("100000");
      expect(parsed.details.gasLimit).toBe("2000000");
    });
  });

  describe("token transfers", () => {
    it("should craft a token transfer with InvokeEVM method", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_ETH_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 15,
        gasFeeCap: 300000n,
        gasPremium: 150000n,
        gasLimit: 3000000n,
        tokenContractAddress: VALID_CONTRACT,
      };

      const result = await craftTransaction(input);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.details.method).toBe(3844450837); // InvokeEVM
      expect(parsed.details.value).toBe("0"); // Token transfers send 0 FIL
    });
  });

  describe("address validation", () => {
    it("should throw for invalid sender address", async () => {
      const input: CraftTransactionInput = {
        sender: "invalid",
        recipient: VALID_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 5,
      };

      await expect(craftTransaction(input)).rejects.toThrow("Invalid sender address");
    });

    it("should throw for invalid recipient address", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: "invalid",
        amount: 100000000000000000n,
        nonce: 5,
      };

      await expect(craftTransaction(input)).rejects.toThrow("Invalid recipient address");
    });

    it("should throw for invalid token contract address", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_ETH_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 5,
        tokenContractAddress: "invalid",
      };

      await expect(craftTransaction(input)).rejects.toThrow("Invalid token contract address");
    });
  });

  describe("edge cases", () => {
    it("should handle zero gas values", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 100000000000000000n,
        nonce: 0,
      };

      const result = await craftTransaction(input);
      const parsed = JSON.parse(result.transaction);

      expect(parsed.details.gasFeeCap).toBe("0");
      expect(parsed.details.gasPremium).toBe("0");
      expect(parsed.details.gasLimit).toBe("0");
    });

    it("should handle zero amount", async () => {
      const input: CraftTransactionInput = {
        sender: VALID_SENDER,
        recipient: VALID_RECIPIENT,
        amount: 0n,
        nonce: 5,
        gasFeeCap: 100000n,
        gasPremium: 50000n,
        gasLimit: 1000000n,
      };

      const result = await craftTransaction(input);
      expect(result.transaction).toBeDefined();
    });
  });
});
