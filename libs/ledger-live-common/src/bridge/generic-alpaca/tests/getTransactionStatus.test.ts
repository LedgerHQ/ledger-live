import BigNumber from "bignumber.js";
import { genericGetTransactionStatus } from "../getTransactionStatus";
import { getAlpacaApi } from "../alpaca";
import { applyMemoToIntent, extractBalances, transactionToIntent } from "../utils";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  transactionToIntent: jest.fn(),
  applyMemoToIntent: jest.fn(intent => intent),
  extractBalances: jest.fn(() => []),
}));

describe("genericGetTransactionStatus", () => {
  const account = {
    id: "test-account",
    currency: { id: "ethereum" },
    pendingOperations: [],
  } as any;

  const validateIntentResult = {
    errors: {},
    warnings: {},
    estimatedFees: 1n,
    amount: 40n,
    totalSpent: 41n,
    totalFees: 1n,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (transactionToIntent as jest.Mock).mockReturnValue({ mock: "intent" });
    (applyMemoToIntent as jest.Mock).mockImplementation(intent => intent);
    (extractBalances as jest.Mock).mockReturnValue([]);
    (getAlpacaApi as jest.Mock).mockReturnValue({
      computeIntentType: jest.fn(),
      validateIntent: jest.fn().mockResolvedValue(validateIntentResult),
    });
  });

  it("uses validated amount when useAllAmount is true", async () => {
    const getStatus = genericGetTransactionStatus("testnet", "local");
    const result = await getStatus(account, {
      family: "evm",
      mode: "send",
      recipient: "0xrecipient",
      amount: new BigNumber(100),
      useAllAmount: true,
      fees: new BigNumber(0),
    } as any);

    expect(result.amount?.toString()).toBe("40");
  });

  it("keeps transaction amount when useAllAmount is false", async () => {
    const getStatus = genericGetTransactionStatus("testnet", "local");
    const result = await getStatus(account, {
      family: "evm",
      mode: "send",
      recipient: "0xrecipient",
      amount: new BigNumber(100),
      useAllAmount: false,
      fees: new BigNumber(0),
    } as any);

    expect(result.amount?.toString()).toBe("100");
  });

  it("uses validated amount when transaction amount is zero", async () => {
    const getStatus = genericGetTransactionStatus("testnet", "local");
    const result = await getStatus(account, {
      family: "evm",
      mode: "send",
      recipient: "0xrecipient",
      amount: new BigNumber(0),
      useAllAmount: false,
      fees: new BigNumber(0),
    } as any);

    expect(result.amount?.toString()).toBe("40");
  });
});
