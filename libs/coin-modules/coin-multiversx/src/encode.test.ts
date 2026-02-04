import BigNumber from "bignumber.js";
import { MultiversXEncodeTransaction } from "./encode";
import type { Transaction } from "./types";

// Mock the decodeTokenAccountId function
jest.mock("@ledgerhq/coin-framework/account", () => ({
  decodeTokenAccountId: jest.fn().mockResolvedValue({
    token: { id: "multiversx/esdt/USDC-c76f1f" },
  }),
}));

// Mock extractTokenId
jest.mock("./logic", () => ({
  extractTokenId: jest.fn().mockReturnValue("555344432d633736663166"),
}));

describe("MultiversXEncodeTransaction", () => {
  describe("delegate", () => {
    it("returns base64 encoded 'delegate'", () => {
      const result = MultiversXEncodeTransaction.delegate();
      expect(result).toBe(Buffer.from("delegate").toString("base64"));
    });

    it("decodes back to 'delegate'", () => {
      const result = MultiversXEncodeTransaction.delegate();
      const decoded = Buffer.from(result, "base64").toString();
      expect(decoded).toBe("delegate");
    });
  });

  describe("claimRewards", () => {
    it("returns base64 encoded 'claimRewards'", () => {
      const result = MultiversXEncodeTransaction.claimRewards();
      expect(result).toBe(Buffer.from("claimRewards").toString("base64"));
    });

    it("decodes back to 'claimRewards'", () => {
      const result = MultiversXEncodeTransaction.claimRewards();
      const decoded = Buffer.from(result, "base64").toString();
      expect(decoded).toBe("claimRewards");
    });
  });

  describe("withdraw", () => {
    it("returns base64 encoded 'withdraw'", () => {
      const result = MultiversXEncodeTransaction.withdraw();
      expect(result).toBe(Buffer.from("withdraw").toString("base64"));
    });

    it("decodes back to 'withdraw'", () => {
      const result = MultiversXEncodeTransaction.withdraw();
      const decoded = Buffer.from(result, "base64").toString();
      expect(decoded).toBe("withdraw");
    });
  });

  describe("reDelegateRewards", () => {
    it("returns base64 encoded 'reDelegateRewards'", () => {
      const result = MultiversXEncodeTransaction.reDelegateRewards();
      expect(result).toBe(Buffer.from("reDelegateRewards").toString("base64"));
    });

    it("decodes back to 'reDelegateRewards'", () => {
      const result = MultiversXEncodeTransaction.reDelegateRewards();
      const decoded = Buffer.from(result, "base64").toString();
      expect(decoded).toBe("reDelegateRewards");
    });
  });

  describe("unDelegate", () => {
    it("encodes unDelegate with amount in hex", () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "unDelegate",
        amount: new BigNumber("1000000000000000000"), // 1 EGLD
        recipient: "",
        useAllAmount: false,
      };

      const result = MultiversXEncodeTransaction.unDelegate(tx);
      const decoded = Buffer.from(result, "base64").toString();

      expect(decoded).toMatch(/^unDelegate@[0-9a-f]+$/);
    });

    it("pads odd-length hex to even length", () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "unDelegate",
        amount: new BigNumber(15), // 0xf (odd length)
        recipient: "",
        useAllAmount: false,
      };

      const result = MultiversXEncodeTransaction.unDelegate(tx);
      const decoded = Buffer.from(result, "base64").toString();

      // Should be padded to "0f"
      expect(decoded).toBe("unDelegate@0f");
    });

    it("handles even-length hex without padding", () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "unDelegate",
        amount: new BigNumber(255), // 0xff (even length)
        recipient: "",
        useAllAmount: false,
      };

      const result = MultiversXEncodeTransaction.unDelegate(tx);
      const decoded = Buffer.from(result, "base64").toString();

      expect(decoded).toBe("unDelegate@ff");
    });

    it("handles large amounts", () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "unDelegate",
        amount: new BigNumber("10000000000000000000"), // 10 EGLD
        recipient: "",
        useAllAmount: false,
      };

      const result = MultiversXEncodeTransaction.unDelegate(tx);
      const decoded = Buffer.from(result, "base64").toString();

      expect(decoded).toMatch(/^unDelegate@[0-9a-f]+$/);
      // Hex length should be even
      const amountHex = decoded.split("@")[1];
      expect(amountHex.length % 2).toBe(0);
    });
  });

  describe("ESDTTransfer", () => {
    it("encodes ESDT transfer with token and amount", async () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "erd1...",
        useAllAmount: false,
      };

      const tokenAccount = {
        id: "js:2:multiversx:erd1...:+USDC-c76f1f",
        balance: new BigNumber("5000000"),
      } as any;

      const result = await MultiversXEncodeTransaction.ESDTTransfer(tx, tokenAccount);
      const decoded = Buffer.from(result, "base64").toString();

      expect(decoded).toMatch(/^ESDTTransfer@[0-9a-f]+@[0-9a-f]+$/);
    });

    it("uses full balance when useAllAmount is true", async () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "erd1...",
        useAllAmount: true,
      };

      const tokenAccount = {
        id: "js:2:multiversx:erd1...:+USDC-c76f1f",
        balance: new BigNumber("5000000"),
      } as any;

      const result = await MultiversXEncodeTransaction.ESDTTransfer(tx, tokenAccount);
      const decoded = Buffer.from(result, "base64").toString();

      // Amount should be balance (5000000 = 0x4c4b40)
      expect(decoded).toContain("@4c4b40");
    });

    it("pads odd-length hex amount", async () => {
      const tx: Transaction = {
        family: "multiversx",
        mode: "send",
        amount: new BigNumber(15), // 0xf (odd length)
        recipient: "erd1...",
        useAllAmount: false,
      };

      const tokenAccount = {
        id: "js:2:multiversx:erd1...:+USDC-c76f1f",
        balance: new BigNumber("5000000"),
      } as any;

      const result = await MultiversXEncodeTransaction.ESDTTransfer(tx, tokenAccount);
      const decoded = Buffer.from(result, "base64").toString();

      // Amount should be padded to "0f"
      expect(decoded).toContain("@0f");
    });
  });
});
