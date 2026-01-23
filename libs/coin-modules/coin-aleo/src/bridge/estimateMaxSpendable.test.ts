import BigNumber from "bignumber.js";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import type { Transaction } from "../types";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("./prepareTransaction");
jest.mock("./createTransaction");

const mockPrepareTransaction = prepareTransaction as jest.MockedFunction<typeof prepareTransaction>;
const mockCreateTransaction = createTransaction as jest.MockedFunction<typeof createTransaction>;

describe("estimateMaxSpendable", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockPreparedTransaction: Transaction = {
    family: "aleo",
    amount: new BigNumber(995000),
    useAllAmount: true,
    recipient: "",
    fees: new BigNumber(5000),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrepareTransaction.mockResolvedValue(mockPreparedTransaction);
    mockCreateTransaction.mockReturnValue({
      family: "aleo",
      amount: new BigNumber(0),
      useAllAmount: false,
      recipient: "",
      fees: new BigNumber(0),
    });
  });

  it("should return balance minus fees", async () => {
    const result = await estimateMaxSpendable({
      account: mockAccount,
      parentAccount: undefined,
      transaction: undefined,
    });

    expect(result).toEqual(mockPreparedTransaction.amount);
  });

  it("should return zero when fees exceed balance", async () => {
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
});
