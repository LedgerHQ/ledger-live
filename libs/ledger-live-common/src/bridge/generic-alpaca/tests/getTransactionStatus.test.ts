import BigNumber from "bignumber.js";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import { getAlpacaApi } from "../alpaca";
import * as utils from "../utils";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  transactionToIntent: jest.fn(),
  applyMemoToIntent: jest.fn(),
  extractBalances: jest.fn(),
}));

const mockTransactionToIntent = utils.transactionToIntent as jest.Mock;
const mockApplyMemoToIntent = utils.applyMemoToIntent as jest.Mock;
const mockExtractBalances = utils.extractBalances as jest.Mock;

describe("genericGetTransactionStatus", () => {
  const account = {
    id: "test-account",
    currency: { id: "ethereum" },
    pendingOperations: [],
  } as any;

  const validatedAmount = 1000n;
  const validateIntentResult = {
    errors: {},
    warnings: {},
    estimatedFees: 50n,
    amount: validatedAmount,
    totalSpent: 1050n,
    totalFees: 50n,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionToIntent.mockReturnValue({ intent: true });
    mockApplyMemoToIntent.mockImplementation((intent: unknown) => intent);
    mockExtractBalances.mockReturnValue({});
    (getAlpacaApi as jest.Mock).mockReturnValue({
      validateIntent: jest.fn().mockResolvedValue(validateIntentResult),
    });
  });

  it.each([
    ["useAllAmount is true", new BigNumber(999), true, new BigNumber(validatedAmount.toString())],
    ["amount is 0", new BigNumber(0), false, new BigNumber(validatedAmount.toString())],
    [
      "useAllAmount is false and amount > 0",
      new BigNumber(500),
      false,
      new BigNumber(validatedAmount.toString()),
    ],
  ])(
    "returns validated amount from validateIntent when %s",
    async (_label, txAmount, useAllAmount, expected) => {
      const getStatus = genericGetTransactionStatus("mainnet", "evm");
      const result = await getStatus(account, {
        amount: txAmount,
        useAllAmount,
        recipient: "0x",
        family: "evm",
      } as any);

      expect(result.amount).toEqual(expected);
    },
  );
});
