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

  it("returns the token account spendable balance directly for a TokenAccount", async () => {
    mockedGetCoinModuleApi.mockReturnValue({ estimateFees: estimateFeesMock });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: { type: "TokenAccount", spendableBalance: new BigNumber(123) } as any,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("123");
    expect(estimateFeesMock).not.toHaveBeenCalled();
  });

  it("subtracts estimated fee from spendable balance", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("49990000");
  });

  it("subtracts additionalFees surfaced in parameters", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({
        value: 10000n,
        parameters: { additionalFees: 5000n },
      }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("49985000");
  });

  it("subtracts funds committed by pending native operations from the send-max", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: {
        ...dummyAccount,
        // pending OUT send commits its value + fee against the native balance until next sync
        pendingOperations: [
          { type: "OUT", value: new BigNumber(1_000_000), fee: new BigNumber(2000) },
        ],
      } as unknown as Account,
      parentAccount: null,
      transaction: {} as any,
    });

    // 50000000 - (1000000 + 2000) pending - 10000 fee
    expect(result.toString()).toBe("48988000");
  });

  it("uses parameters.amount when the coin module provides it", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({
        value: 10000n,
        parameters: { amount: 42n },
      }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("42");
  });

  it("falls back to 0 when parameters.amount is not numeric", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({
        value: 10000n,
        parameters: { amount: null },
      }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("0");
  });

  it("returns 0 if fee is higher than spendable", async () => {
    const poorAccount = {
      ...dummyAccount,
      spendableBalance: new BigNumber(5000),
    };

    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
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
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("50000000");
  });

  it("overrides the estimated fee value with the provided one but keeps coin parameters", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({
        value: 999n,
        parameters: { amount: 42n },
      }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: { fees: new BigNumber(20000) } as any,
    });

    // parameters.amount wins over the spendable-minus-fee computation
    expect(result.toString()).toBe("42");
    expect(estimateFeesMock).toHaveBeenCalled();
  });

  it("overrides the estimated fee value with the provided fees + additionalFees", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 999n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: { fees: new BigNumber(20000), additionalFees: new BigNumber(5000) } as any,
    });

    expect(result.toString()).toBe("49975000");
  });
});
