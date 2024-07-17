import BigNumber from "bignumber.js";
import { Transaction, IconAccount } from "../../types";
import { createFixtureAccount, createFixtureTransaction } from "../../types/bridge.fixture";
import { buildTransaction } from "../../buildTransaction";

const mockFrom = jest.fn().mockReturnThis();
const mockTo = jest.fn().mockReturnThis();
const mockValue = jest.fn().mockReturnThis();
const mockNid = jest.fn().mockReturnThis();
const mockNonce = jest.fn().mockReturnThis();
const mockTimestamp = jest.fn().mockReturnThis();
const mockVersion = jest.fn().mockReturnThis();
const mockStepLimit = jest.fn().mockReturnThis();
const mockBuild = jest.fn().mockReturnValue("mocked-transaction");

jest.mock("icon-sdk-js", () => ({
  IconBuilder: {
    IcxTransactionBuilder: jest.fn().mockImplementation(() => ({
      from: mockFrom,
      to: mockTo,
      value: mockValue,
      nid: mockNid,
      nonce: mockNonce,
      timestamp: mockTimestamp,
      version: mockVersion,
      stepLimit: mockStepLimit,
      build: mockBuild,
    })),
  },
  IconConverter: {
    toHexNumber: jest.fn(value => `0x${value}`),
  },
}));

jest.mock("../../logic", () => ({
  getNid: jest.fn().mockReturnValue(1),
  getNonce: jest.fn().mockReturnValue(1),
}));

describe("buildTransaction", () => {
  const account = createFixtureAccount() as IconAccount;
  const transaction = createFixtureTransaction({
    mode: "send",
    recipient: "WHATEVER",
  }) as Transaction;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should build a transfer transaction", async () => {
    const stepLimit = new BigNumber(100000);
    const result = await buildTransaction(account, transaction, stepLimit);

    expect(mockFrom).toHaveBeenCalledWith(account.freshAddress);
    expect(mockTo).toHaveBeenCalledWith(transaction.recipient);
    expect(mockValue).toHaveBeenCalledWith(expect.any(String));
    expect(mockNid).toHaveBeenCalledWith(expect.any(String));
    expect(mockNonce).toHaveBeenCalledWith(expect.any(String));
    expect(mockTimestamp).toHaveBeenCalledWith(expect.any(String));
    expect(mockVersion).toHaveBeenCalledWith(expect.any(String));
    expect(mockStepLimit).toHaveBeenCalledWith(expect.any(String));
    expect(result.unsigned).toBe("mocked-transaction");
  });

  it("should throw an error for unsupported transaction mode", async () => {
    const invalidTransaction: Transaction = {
      ...transaction,
      mode: "invalid-mode",
    };

    await expect(buildTransaction(account, invalidTransaction)).rejects.toThrow(
      "Unsupported transaction mode: invalid-mode",
    );
  });
});
