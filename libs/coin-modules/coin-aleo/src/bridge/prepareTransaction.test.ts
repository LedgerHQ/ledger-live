import BigNumber from "bignumber.js";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic");
jest.mock("../logic/utils");

const mockEstimateFees = estimateFees as jest.MockedFunction<typeof estimateFees>;
const mockCalculateAmount = calculateAmount as jest.MockedFunction<typeof calculateAmount>;

describe("prepareTransaction", () => {
  const mockAccount = getMockedAccount({ balance: new BigNumber(1000000) });
  const mockFees = new BigNumber(5000);
  const mockAmount = new BigNumber(500000);
  const mockTransaction: Transaction = {
    family: "aleo",
    amount: new BigNumber(500000),
    useAllAmount: false,
    recipient: "aleo1recipient",
    fees: new BigNumber(0),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockEstimateFees.mockResolvedValue(mockFees);
    mockCalculateAmount.mockReturnValue({
      amount: mockAmount,
      totalSpent: mockAmount.plus(mockFees),
    });
  });

  it("should return transaction with calculated amount and fees", async () => {
    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(result).toMatchObject({
      amount: mockAmount,
      fees: mockFees,
    });
  });

  it("should call calculateAmount", async () => {
    await prepareTransaction(mockAccount, mockTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockTransaction,
      account: mockAccount,
      estimatedFees: mockFees,
    });
  });
});
