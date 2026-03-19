import BigNumber from "bignumber.js";
import { getMockedAccount, mockUnspentRecord1 } from "../__tests__/fixtures/account.fixture";
import type { Transaction } from "../types";
import { TRANSACTION_TYPE } from "../constants";
import { getRecordByCommitment, isPrivateTransaction } from "../logic/utils";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("./prepareTransaction");
jest.mock("./createTransaction");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  getRecordByCommitment: jest.fn(),
  isPrivateTransaction: jest.fn(),
}));

const mockPrepareTransaction = jest.mocked(prepareTransaction);
const mockCreateTransaction = jest.mocked(createTransaction);
const mockGetRecordByCommitment = jest.mocked(getRecordByCommitment);
const mockIsPrivateTransaction = jest.mocked(isPrivateTransaction);

describe("estimateMaxSpendable", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockPreparedTransaction: Transaction = {
    family: "aleo",
    amount: new BigNumber(995000),
    useAllAmount: true,
    recipient: "",
    fees: new BigNumber(5000),
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrepareTransaction.mockResolvedValue(mockPreparedTransaction);
    mockIsPrivateTransaction.mockReturnValue(false);
    mockCreateTransaction.mockReturnValue({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
      mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });
  });

  it("should return the amount from prepared transaction", async () => {
    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(mockPreparedTransaction.amount);
  });

  it("should return zero when prepared transaction amount is zero", async () => {
    const mockPoorAccount = getMockedAccount({ balance: new BigNumber(3000) });

    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      amount: new BigNumber(0),
    });

    const result = await estimateMaxSpendable({
      account: mockPoorAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
  });

  it("should call prepareTransaction with useAllAmount true", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: {
        ...mockPreparedTransaction,
        useAllAmount: false,
      },
    });

    expect(mockPrepareTransaction).toHaveBeenCalledTimes(1);
    expect(mockPrepareTransaction).toHaveBeenCalledWith(
      mockAccount,
      expect.objectContaining({ useAllAmount: true }),
    );
  });

  it("should fallback to createTransaction when transaction is not provided", async () => {
    await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    expect(mockCreateTransaction).toHaveBeenCalledWith(mockAccount);
  });

  it("should return zero for private tx when amountRecordCommitment is missing", async () => {
    mockIsPrivateTransaction.mockReturnValue(true);
    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitment: null,
        feeRecordCommitment: null,
      },
    });

    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(new BigNumber(0));
    expect(mockGetRecordByCommitment).not.toHaveBeenCalled();
  });

  it("should return microcredits value for private tx when amountRecordCommitment exists", async () => {
    const commitment = "record-1-commitment";
    mockIsPrivateTransaction.mockReturnValue(true);
    mockPrepareTransaction.mockResolvedValue({
      ...mockPreparedTransaction,
      mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      properties: {
        amountRecordCommitment: commitment,
        feeRecordCommitment: null,
      },
    });
    mockGetRecordByCommitment.mockReturnValue({
      ...mockUnspentRecord1,
      microcredits: "12345",
    });

    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(mockGetRecordByCommitment).toHaveBeenCalledTimes(1);
    expect(mockGetRecordByCommitment).toHaveBeenCalledWith({
      account: mockAccount,
      commitment,
    });
    expect(result).toEqual(new BigNumber(12345));
  });
});
