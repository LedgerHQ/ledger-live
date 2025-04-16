import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { BigNumber } from "bignumber.js";
import suiAPI from "../network";
import { Transaction } from "../types";

jest.mock("../network");

describe("Transaction Operations", () => {
  const mockAddress = "0x1234567890abcdef";
  const mockRecipient = "0xfedcba0987654321";
  const mockAmount = new BigNumber(1000000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("craftTransaction", () => {
    it("should craft a valid transaction", async () => {
      const mockUnsignedTx = new Uint8Array([1, 2, 3, 4]);
      (suiAPI.createTransaction as jest.Mock).mockResolvedValue(mockUnsignedTx);

      const result = await craftTransaction(mockAddress, {
        mode: "send",
        amount: mockAmount,
        recipient: mockRecipient,
      });

      expect(result).toBeDefined();
      expect(result.unsigned).toBe(mockUnsignedTx);
      expect(suiAPI.createTransaction).toHaveBeenCalledWith(mockAddress, {
        mode: "send",
        amount: mockAmount,
        recipient: mockRecipient,
      });
    });

    it("should handle transaction crafting errors", async () => {
      (suiAPI.createTransaction as jest.Mock).mockRejectedValue(new Error("Crafting failed"));

      await expect(
        craftTransaction(mockAddress, {
          mode: "send",
          amount: mockAmount,
          recipient: mockRecipient,
        }),
      ).rejects.toThrow("Crafting failed");
    });
  });

  describe("estimateFees", () => {
    it("should estimate fees correctly", async () => {
      const mockGasBudget = 1000n;
      (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({ gasBudget: mockGasBudget });

      const mockTransaction: Transaction = {
        recipient: mockRecipient,
        amount: mockAmount,
        mode: "send",
        family: "sui",
        errors: {},
      };

      const result = await estimateFees(mockAddress, mockTransaction);

      expect(result).toBe(mockGasBudget);
      expect(suiAPI.paymentInfo).toHaveBeenCalledWith(mockAddress, mockTransaction);
    });

    it("should handle fee estimation errors", async () => {
      (suiAPI.paymentInfo as jest.Mock).mockRejectedValue(new Error("Estimation failed"));

      const mockTransaction: Transaction = {
        recipient: mockRecipient,
        amount: mockAmount,
        mode: "send",
        family: "sui",
        errors: {},
      };

      await expect(estimateFees(mockAddress, mockTransaction)).rejects.toThrow("Estimation failed");
    });
  });
});
