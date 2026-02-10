import { BigNumber } from "bignumber.js";
import { craftTransaction } from "../logic/craftTransaction";
import suiAPI from "../network";

jest.mock("../network");

describe("craftTransaction", () => {
  const mockUnsignedTx = new Uint8Array([1, 2, 3]);
  const mockCreateTransaction = suiAPI.createTransaction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTransaction.mockResolvedValue({ unsigned: mockUnsignedTx });
  });

  it("should create a transaction with correct parameters", async () => {
    const sender = "0x123";
    const amount = BigInt("1000000000");
    const recipient = "0x456";
    const type = "send";
    const intentType = "transaction";

    const result = await craftTransaction({
      intentType,
      sender,
      amount,
      recipient,
      type,
      asset: { type: "native" },
    });

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      sender,
      {
        intentType,
        amount: new BigNumber(amount.toString()),
        recipient,
        mode: type,
        coinType: "0x2::sui::SUI",
      },
      false,
      undefined,
    );
    expect(result).toEqual({ unsigned: mockUnsignedTx });
  });

  it("should handle different transaction types", async () => {
    const sender = "0x123";
    const amount = BigInt("500000000");
    const recipient = "0x456";
    const type = "send";
    const intentType = "transaction";

    const result = await craftTransaction({
      intentType,
      sender,
      amount,
      recipient,
      type,
      asset: { type: "native" },
    });

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      sender,
      {
        intentType,
        amount: new BigNumber(amount.toString()),
        recipient,
        mode: type,
        coinType: "0x2::sui::SUI",
      },
      false,
      undefined,
    );
    expect(result).toEqual({ unsigned: mockUnsignedTx });
  });

  it("should handle zero amount transactions", async () => {
    const sender = "0x123";
    const amount = BigInt("0");
    const recipient = "0x456";
    const type = "send";
    const intentType = "transaction";

    const result = await craftTransaction({
      intentType,
      sender,
      amount,
      recipient,
      type,
      asset: { type: "native" },
    });

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      sender,
      {
        intentType,
        amount: new BigNumber(amount.toString()),
        recipient,
        mode: type,
        coinType: "0x2::sui::SUI",
      },
      false,
      undefined,
    );
    expect(result).toEqual({ unsigned: mockUnsignedTx });
  });

  it("should handle large amount transactions", async () => {
    const sender = "0x123";
    const amount = BigInt("1000000000000000000"); // 1 SUI (assuming 9 decimals)
    const recipient = "0x456";
    const type = "send";
    const intentType = "transaction";

    const result = await craftTransaction({
      intentType,
      sender,
      amount,
      recipient,
      type,
      asset: { type: "native" },
    });

    expect(mockCreateTransaction).toHaveBeenCalledWith(
      sender,
      {
        intentType,
        amount: new BigNumber(amount.toString()),
        recipient,
        mode: type,
        coinType: "0x2::sui::SUI",
      },
      false,
      undefined,
    );
    expect(result).toEqual({ unsigned: mockUnsignedTx });
  });

  it("should handle error cases from createTransaction", async () => {
    const error = new Error("Network error");
    mockCreateTransaction.mockRejectedValue(error);

    const sender = "0x123";
    const amount = BigInt("1000000000");
    const recipient = "0x456";
    const type = "send";
    const intentType = "transaction";

    await expect(
      craftTransaction({
        intentType,
        sender,
        amount,
        recipient,
        type,
        asset: { type: "native" },
      }),
    ).rejects.toThrow("Network error");
  });
});
