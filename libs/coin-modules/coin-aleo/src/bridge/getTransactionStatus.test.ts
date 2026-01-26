import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import { getTransactionStatus } from "./getTransactionStatus";

jest.mock("../logic");
jest.mock("../logic/utils");

const mockEstimateFees = estimateFees as jest.MockedFunction<typeof estimateFees>;
const mockCalculateAmount = calculateAmount as jest.MockedFunction<typeof calculateAmount>;

describe("getTransactionStatus", () => {
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

  it("should return empty errors and warnings for valid transaction", async () => {
    const result = await getTransactionStatus(mockAccount, mockTransaction);

    expect(result).toMatchObject({
      amount: mockAmount,
      totalSpent: mockAmount.plus(mockFees),
      estimatedFees: mockFees,
      errors: {},
      warnings: {},
    });
  });

  it("should call calculateAmount", async () => {
    await getTransactionStatus(mockAccount, mockTransaction);

    expect(mockCalculateAmount).toHaveBeenCalledTimes(1);
    expect(mockCalculateAmount).toHaveBeenCalledWith({
      transaction: mockTransaction,
      account: mockAccount,
      estimatedFees: mockFees,
    });
  });
});
