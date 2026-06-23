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

  it("should return both the accurate fee and the gas budget as bigints", async () => {
    // Mock the paymentInfo response: dry-run returns the actual gas (`fees`) and the reserved budget.
    const mockGasBudget = "1000000";
    const mockFees = "850000";
    (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({
      gasBudget: mockGasBudget,
      fees: mockFees,
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
      undefined,
    );
    expect(result).toEqual({ fees: BigInt(mockFees), gasBudget: BigInt(mockGasBudget) });
  });

  it("should handle zero amount transactions", async () => {
    const mockGasBudget = "500000";
    const mockFees = "400000";
    (suiAPI.paymentInfo as jest.Mock).mockResolvedValue({
      gasBudget: mockGasBudget,
      fees: mockFees,
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
      undefined,
    );
    expect(result).toEqual({ fees: BigInt(mockFees), gasBudget: BigInt(mockGasBudget) });
  });
});
