import { estimateFees } from "./estimateFees";
import suiAPI from "../network";
import { BigNumber } from "bignumber.js";

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
      sender: "0x123",
      recipient: "0x456",
      amount: BigInt("1000000000"),
      type: "send",
      asset: { type: "native" as const },
    };

    const result = await estimateFees(transactionIntent);

    expect(suiAPI.paymentInfo).toHaveBeenCalledWith(transactionIntent.sender, {
      recipient: transactionIntent.recipient,
      amount: BigNumber(transactionIntent.amount.toString()),
    });
    expect(result).toBe(BigInt(mockGasBudget));
  });

  it("should handle zero amount transactions", async () => {
    const mockGasBudget = "500000";
    (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({
      gasBudget: mockGasBudget,
    });

    const transactionIntent = {
      sender: "0x123",
      recipient: "0x456",
      amount: BigInt("0"),
      type: "send",
      asset: { type: "native" as const },
    };

    const result = await estimateFees(transactionIntent);

    expect(suiAPI.paymentInfo).toHaveBeenCalledWith(transactionIntent.sender, {
      recipient: transactionIntent.recipient,
      amount: BigNumber("0"),
    });
    expect(result).toBe(BigInt(mockGasBudget));
  });
});
