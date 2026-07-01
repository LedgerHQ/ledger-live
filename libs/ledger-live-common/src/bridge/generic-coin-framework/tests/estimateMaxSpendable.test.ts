import BigNumber from "bignumber.js";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import * as coinframework from "../api";
import { Account } from "@ledgerhq/types-live";

// Mock the coin module API
jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../createTransaction", () => ({
  createTransaction: jest.fn().mockReturnValue({}),
}));

const mockedGetCoinModuleApi = coinframework.getCoinModuleApi as jest.Mock;

describe("genericEstimateMaxSpendable", () => {
  const validateIntentMock = jest.fn();
  const estimateFeesMock = jest.fn();
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
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
      validateIntent: validateIntentMock.mockResolvedValue({ amount: 49990000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("49990000");
    expect(validateIntentMock).toHaveBeenCalledWith(
      expect.anything(),
      [{ value: 60000000n, locked: 10000000n, asset: { type: "native" } }],
      expect.anything(),
    );
  });

  it("returns 0 if fee is higher than spendable", async () => {
    const poorAccount = {
      ...dummyAccount,
      spendableBalance: new BigNumber(5000),
    };

    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
      validateIntent: validateIntentMock.mockResolvedValue({ amount: 0n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: poorAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("0");
  });

  describe("TokenAccount", () => {
    const tokenAccount = {
      id: "token_account_id",
      type: "TokenAccount",
      spendableBalance: new BigNumber(6),
      balance: new BigNumber(6),
      pendingOperations: [],
    } as unknown as Account;

    it("returns the raw spendable balance when there is no pending op", async () => {
      const estimate = genericEstimateMaxSpendable("testnet", "local");
      const result = await estimate({
        account: tokenAccount,
        parentAccount: dummyAccount,
        transaction: {} as any,
      });

      expect(result.toString()).toBe("6");
    });

    it("subtracts the pending token spend so the banner matches send-max", async () => {
      const estimate = genericEstimateMaxSpendable("testnet", "local");
      const result = await estimate({
        account: {
          ...tokenAccount,
          // optimistic OUT sub-op for a pending 1-token send (fee is paid in native)
          pendingOperations: [{ type: "OUT", value: new BigNumber(1), fee: new BigNumber(2) }],
        } as unknown as Account,
        parentAccount: dummyAccount,
        transaction: {} as any,
      });

      expect(result.toString()).toBe("5");
    });

    it("never returns a negative spendable balance", async () => {
      const estimate = genericEstimateMaxSpendable("testnet", "local");
      const result = await estimate({
        account: {
          ...tokenAccount,
          pendingOperations: [{ type: "OUT", value: new BigNumber(10), fee: new BigNumber(2) }],
        } as unknown as Account,
        parentAccount: dummyAccount,
        transaction: {} as any,
      });

      expect(result.toString()).toBe("0");
    });
  });

  it("returns full spendable balance if fee is 0", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 0n }),
      validateIntent: validateIntentMock.mockResolvedValue({ amount: 50000000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("50000000");
  });
});
