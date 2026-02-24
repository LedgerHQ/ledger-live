import BigNumber from "bignumber.js";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import * as alpaca from "../alpaca";
import { Account } from "@ledgerhq/types-live";

// Mock the alpaca API
jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../createTransaction", () => ({
  createTransaction: jest.fn().mockReturnValue({}),
}));

const mockedGetAlpacaApi = alpaca.getAlpacaApi as jest.Mock;

describe("genericEstimateMaxSpendable", () => {
  const dummyAccount = {
    id: "account_id",
    type: "Account",
    spendableBalance: new BigNumber(50000000),
    balance: new BigNumber(60000000),
    currency: {
      id: "currency_family",
      family: "currency_family",
      name: "currency_name",
      units: [{ name: "currency_name", code: "currency_code", magnitude: 6 }],
    },
    freshAddress: "account_address",
    pendingOperations: [],
  } as unknown as Account;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("subtracts estimated fee from spendable balance", async () => {
    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 10000n }),
      validateIntent: jest.fn().mockResolvedValue({ amount: 49990000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("49990000");
  });

  it("returns 0 if fee is higher than spendable", async () => {
    const poorAccount = {
      ...dummyAccount,
      spendableBalance: new BigNumber(5000),
    };

    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 10000n }),
      validateIntent: jest.fn().mockResolvedValue({ amount: 0n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: poorAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("0");
  });

  it("returns full spendable balance if fee is 0", async () => {
    mockedGetAlpacaApi.mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: 0n }),
      validateIntent: jest.fn().mockResolvedValue({ amount: 50000000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {},
    });

    expect(result.toString()).toBe("50000000");
  });
});
