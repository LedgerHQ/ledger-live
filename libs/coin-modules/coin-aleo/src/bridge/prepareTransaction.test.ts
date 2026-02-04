import BigNumber from "bignumber.js";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { estimateFees } from "../logic";
import { calculateAmount } from "../logic/utils";
import type { Transaction } from "../types";
import aleoCoinConfig from "../config";
import { TRANSACTION_TYPE } from "../constants";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic");
jest.mock("../logic/utils");

const mockEstimateFees = jest.mocked(estimateFees);
const mockCalculateAmount = jest.mocked(calculateAmount);

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
    type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
  };
  const mockGetCoinConfig = jest.spyOn(aleoCoinConfig, "getCoinConfig");

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinConfig.mockReturnValue(getMockedConfig());
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
