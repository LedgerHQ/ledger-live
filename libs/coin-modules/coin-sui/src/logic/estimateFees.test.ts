import { BigNumber } from "bignumber.js";
import suiAPI from "../network";
import { estimateFees } from "./estimateFees";

// Mock the suiAPI module
jest.mock("../network", () => ({
  __esModule: true,
  default: {
    paymentInfo: jest.fn(),
  },
}));

describe("estimateFees", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the correct gas budget as bigint", async () => {
    // Mock the paymentInfo response
    const mockGasBudget = "1000000";
    (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({
      gasBudget: mockGasBudget,
    });

    const transactionIntent = {
      intentType: "transaction" as const,
      sender: "0x123",
      recipient: "0x456",
      amount: BigInt("1000000000"),
      type: "send",
      asset: { type: "native" as const },
    };

    const result = await estimateFees(transactionIntent);

    expect(suiAPI.paymentInfo).toHaveBeenCalledWith(
      transactionIntent.sender,
      expect.objectContaining({
        recipient: transactionIntent.recipient,
        amount: BigNumber(transactionIntent.amount.toString()),
        coinType: "0x2::sui::SUI",
        errors: {},
        family: "sui",
        mode: "send",
      }),
    );
    expect(result).toBe(BigInt(mockGasBudget));
  });

  it("should handle zero amount transactions", async () => {
    const mockGasBudget = "500000";
    (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({
      gasBudget: mockGasBudget,
    });

    const transactionIntent = {
      intentType: "transaction" as const,
      sender: "0x123",
      recipient: "0x456",
      amount: BigInt("0"),
      type: "send",
      asset: { type: "native" as const },
    };

    const result = await estimateFees(transactionIntent);

    expect(suiAPI.paymentInfo).toHaveBeenCalledWith(
      transactionIntent.sender,
      expect.objectContaining({
        recipient: transactionIntent.recipient,
        amount: BigNumber("0"),
        coinType: "0x2::sui::SUI",
        errors: {},
        family: "sui",
        mode: "send",
      }),
    );
    expect(result).toBe(BigInt(mockGasBudget));
  });
});
