import BigNumber from "bignumber.js";
import { genericEstimateMaxSpendable } from "../estimateMaxSpendable";
import * as coinframework from "../api";
import { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { UnsupportedMaxSpendableFilter } from "@ledgerhq/ledger-wallet-framework/errors";

// Mock the coin module API
jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));

jest.mock("../createTransaction", () => ({
  createTransaction: jest.fn().mockReturnValue({}),
}));

const getBridgeApiMock = jest.fn().mockResolvedValue({});
jest.mock("../bridge", () => ({
  getBridgeApi: (...a: unknown[]) => getBridgeApiMock(...a),
}));

const mockedGetCoinModuleApi = coinframework.getCoinModuleApi as jest.Mock;

// The framework threads a context and calls `craftTransactionData(context, intent)` on the coin
// module api; mirror the default impl (`{ type: "none" }`) so the mocked api exposes it.
const craftTransactionData = () => ({ type: "none" });

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
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock,
    });

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
      craftTransactionData,
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

  it("floors max spendable at zero when fee exceeds balance", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 100_000_000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("0");
    expect(estimateFeesMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a failed estimation when the family does not opt in", async () => {
    const refusal = new Error("estimation failed");
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock.mockRejectedValue(refusal),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");

    await expect(
      estimate({ account: dummyAccount, parentAccount: null, transaction: {} as any }),
    ).rejects.toBe(refusal);
  });

  it("returns 0 on a failed estimation when the family opts in", async () => {
    getBridgeApiMock.mockResolvedValueOnce({ validatesRefusedEstimation: true });
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock.mockRejectedValue(new Error("estimation failed")),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const result = await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("0");
  });

  it("rejects an intent the family cannot build, even when it opts in", async () => {
    getBridgeApiMock.mockResolvedValueOnce({
      validatesRefusedEstimation: true,
      computeIntentType: () => {
        throw new Error("Unsupported transaction mode: bogus");
      },
    });
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock,
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");

    await expect(
      estimate({ account: dummyAccount, parentAccount: null, transaction: {} as any }),
    ).rejects.toThrow("Unsupported transaction mode: bogus");
    expect(estimateFeesMock).not.toHaveBeenCalled();
  });

  it("prices the send-max against the family's own intent data", async () => {
    const buildIntentData = jest.fn().mockReturnValue({ type: "familyx" });
    getBridgeApiMock.mockResolvedValueOnce({ buildIntentData });
    mockedGetCoinModuleApi.mockReturnValue({
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10000n }),
    });

    const estimate = genericEstimateMaxSpendable("testnet", "local");
    await estimate({
      account: dummyAccount,
      parentAccount: null,
      transaction: { familySpecificData: { resource: "ENERGY" } } as any,
    });

    expect(buildIntentData).toHaveBeenCalledWith(
      expect.objectContaining({
        useAllAmount: true,
        familySpecificData: { resource: "ENERGY" },
      }),
    );
    expect(estimateFeesMock).toHaveBeenCalledWith(
      expect.anything(), // context
      expect.objectContaining({ data: { type: "familyx" } }),
    );
  });

  it("subtracts additionalFees surfaced in parameters", async () => {
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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
      craftTransactionData,
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

  describe("NEAR: staked balance does not inflate send-max", () => {
    // NEAR accounts have balance > spendableBalance when tokens are staked or storage-reserved.
    // The framework must use spendableBalance (not balance) for max-spendable computation.
    it("returns spendableBalance - fee for a NEAR account with locked staking funds", async () => {
      const nearAccount = {
        ...dummyAccount,
        currency: {
          id: "near",
          family: "near",
          name: "NEAR",
          units: [{ code: "NEAR", magnitude: 24 }],
        },
        balance: new BigNumber(100_000_000),
        spendableBalance: new BigNumber(30_000_000),
      } as unknown as Account;

      mockedGetCoinModuleApi.mockReturnValue({
        craftTransactionData,
        estimateFees: estimateFeesMock.mockResolvedValue({ value: 1_000_000n }),
      });

      const estimate = genericEstimateMaxSpendable("mainnet", "near");
      const result = await estimate({
        account: nearAccount,
        parentAccount: null,
        transaction: {} as any,
      });

      expect(result.toString()).toBe("29000000");
    });
  });

  describe("Cosmos: delegated and unbonding funds are not spendable", () => {
    const cosmos = getCryptoCurrencyById("cosmos");

    it("returns the liquid spendableBalance - fee, ignoring staked and unbonding principal", async () => {
      const { default: cosmosBridge } = await import("../../../families/cosmos/bridge/api");
      getBridgeApiMock.mockResolvedValueOnce(cosmosBridge(cosmos));
      const cosmosAccount = {
        ...dummyAccount,
        currency: cosmos,
        freshAddress: "cosmos1sender",
        // balance = liquid 5_000_000 + delegated 40_000_000 + unbonding 15_000_000
        balance: new BigNumber(60_000_000),
        spendableBalance: new BigNumber(5_000_000),
        stakingResources: {
          delegations: [
            {
              validatorAddress: "cosmosvaloper1validator",
              amount: new BigNumber(40_000_000),
              status: "active",
            },
          ],
          unbondings: [
            {
              validatorAddress: "cosmosvaloper1validator",
              amount: new BigNumber(15_000_000),
              status: "deactivating",
            },
          ],
        },
      } as unknown as Account;

      mockedGetCoinModuleApi.mockReturnValue({
        craftTransactionData,
        estimateFees: estimateFeesMock.mockResolvedValue({ value: 7_500n }),
      });

      const estimate = genericEstimateMaxSpendable("cosmos", "cosmos");
      const result = await estimate({
        account: cosmosAccount,
        parentAccount: null,
        transaction: {} as any,
      });

      // 5000000 liquid - 7500 fee; the 55000000 staked/unbonding principal is out of reach
      expect(result.toString()).toBe("4992500");
      expect(estimateFeesMock).toHaveBeenCalledWith(
        expect.anything(), // context
        expect.objectContaining({
          type: "send",
          intentType: "transaction",
          sender: "cosmos1sender",
          amount: 5_000_000n,
          useAllAmount: true,
        }),
      );
    });
  });
});

describe("genericEstimateMaxSpendable with filters", () => {
  const estimateFeesMock = jest.fn();
  const craftTransactionData = () => ({ type: "none" });
  const rows = [
    { value: new BigNumber(40_000_000), locked: new BigNumber(10_000_000), pool: "main" },
    { value: new BigNumber(15_000_000), pool: "reserve", private: true },
  ];
  const makeAccount = (overrides: Record<string, unknown> = {}) =>
    ({
      id: "account_id",
      type: "Account",
      spendableBalance: new BigNumber(50_000_000),
      balance: new BigNumber(55_000_000),
      balances: rows,
      currency: {
        id: "currency_family",
        family: "currency_family",
        name: "currency_name",
        units: [{ name: "currency_name", code: "currency_code", magnitude: 6 }],
      },
      freshAddress: "account_address",
      pendingOperations: [],
      ...overrides,
    }) as unknown as Account;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCoinModuleApi.mockReturnValue({
      craftTransactionData,
      estimateFees: estimateFeesMock.mockResolvedValue({ value: 10_000n }),
    });
  });

  it("sets the pool of the selected row on the intent and bounds the amount by the row", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");

    const result = await estimate({
      account: makeAccount(),
      parentAccount: null,
      transaction: {} as any,
      filters: { pools: ["main"] },
    });

    // The row's spendable part is 30,000,000: the 50,000,000 account balance is out of reach.
    expect(result.toString()).toBe("29990000");
    expect(estimateFeesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pool: "main", amount: 30_000_000n, useAllAmount: true }),
    );
  });

  it("selects the row by the private flag", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");

    const result = await estimate({
      account: makeAccount(),
      parentAccount: null,
      transaction: {} as any,
      filters: { private: true },
    });

    expect(result.toString()).toBe("14990000");
    expect(estimateFeesMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pool: "reserve" }),
    );
  });

  it("takes the pending operations out of the selected public row", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({
      spendableBalance: new BigNumber(50_000_000),
      pendingOperations: [{ type: "OUT", value: new BigNumber(30_000_000), fee: new BigNumber(0) }],
    });

    const result = await estimate({
      account,
      parentAccount: null,
      transaction: {} as any,
      filters: { pools: ["main"] },
    });

    // The pending 30,000,000 sits on the public row, whose 30,000,000 spendable part is used up.
    expect(result.toString()).toBe("0");
  });

  it("takes a pending spend out of the public row even when other pools could cover it", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({
      balance: new BigNumber(100_000_000),
      spendableBalance: new BigNumber(95_000_000),
      balances: [
        { value: new BigNumber(60_000_000), locked: new BigNumber(5_000_000), pool: "main" },
        { value: new BigNumber(40_000_000), pool: "reserve", private: true },
      ],
      pendingOperations: [{ type: "OUT", value: new BigNumber(5_000_000), fee: new BigNumber(0) }],
    });

    const result = await estimate({
      account,
      parentAccount: null,
      transaction: {} as any,
      filters: { pools: ["main"] },
    });

    // 60,000,000 minus the 5,000,000 locked and the 5,000,000 pending leaves 50,000,000.
    expect(result.toString()).toBe("49990000");
  });

  it("leaves a private row untouched by a pending public spend", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({
      pendingOperations: [{ type: "OUT", value: new BigNumber(30_000_000), fee: new BigNumber(0) }],
    });

    const result = await estimate({
      account,
      parentAccount: null,
      transaction: {} as any,
      filters: { private: true },
    });

    expect(result.toString()).toBe("14990000");
  });

  it("sends no pool for the default row of a family without pools", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({ balances: [{ value: new BigNumber(50_000_000) }] });

    const result = await estimate({
      account,
      parentAccount: null,
      transaction: {} as any,
      filters: { private: false },
    });

    expect(result.toString()).toBe("49990000");
    expect(estimateFeesMock.mock.calls[0][1]).not.toHaveProperty("pool");
  });

  it("refuses rows that belong to several pools", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({
      balances: [
        { value: new BigNumber(1), pool: "main" },
        { value: new BigNumber(2), pool: "reserve" },
      ],
    });

    await expect(
      estimate({
        account,
        parentAccount: null,
        transaction: {} as any,
        filters: { private: false },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
    expect(estimateFeesMock).not.toHaveBeenCalled();
  });

  it("refuses filters that select no row", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");

    await expect(
      estimate({
        account: makeAccount(),
        parentAccount: null,
        transaction: {} as any,
        filters: { pools: ["unknown"] },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
  });

  it("sums the selected rows of a token account", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const token = {
      type: "TokenAccount",
      spendableBalance: new BigNumber(900),
      balances: [
        { value: new BigNumber(100), locked: new BigNumber(10), pool: "main" },
        { value: new BigNumber(50), pool: "main", private: true },
        { value: new BigNumber(700), pool: "reserve" },
      ],
      pendingOperations: [],
    } as any;

    const result = await estimate({
      account: token,
      parentAccount: null,
      transaction: {} as any,
      filters: { pools: ["main"] },
    });

    expect(result.toString()).toBe("140");
    expect(estimateFeesMock).not.toHaveBeenCalled();
  });

  it("subtracts a token account's pending spend and floors at zero", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const token = {
      type: "TokenAccount",
      spendableBalance: new BigNumber(100),
      balances: [{ value: new BigNumber(100), pool: "main" }],
      pendingOperations: [{ type: "OUT", value: new BigNumber(30) }],
    } as any;

    expect(
      (
        await estimate({
          account: token,
          parentAccount: null,
          transaction: {} as any,
          filters: { pools: ["main"] },
        })
      ).toString(),
    ).toBe("70");

    token.pendingOperations = [{ type: "OUT", value: new BigNumber(500) }];
    expect(
      (
        await estimate({
          account: token,
          parentAccount: null,
          transaction: {} as any,
          filters: { pools: ["main"] },
        })
      ).toString(),
    ).toBe("0");
  });

  it("drops the pool a transaction names when the filter selects a row without a pool", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const account = makeAccount({
      balances: [
        { value: new BigNumber(40_000_000), locked: new BigNumber(10_000_000) },
        { value: new BigNumber(15_000_000), pool: "reserve", private: true },
      ],
    });

    await estimate({
      account,
      parentAccount: null,
      transaction: { pool: "reserve" } as any,
      filters: { private: false },
    });

    expect(estimateFeesMock.mock.calls[0][1]).not.toHaveProperty("pool");
  });

  it("refuses a row without a pool combined with a named pool", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const mixed = [{ value: new BigNumber(100) }, { value: new BigNumber(700), pool: "reserve" }];

    await expect(
      estimate({
        account: makeAccount({ balance: new BigNumber(800), balances: mixed }),
        parentAccount: null,
        transaction: {} as any,
        filters: { private: false },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
    await expect(
      estimate({
        account: {
          type: "TokenAccount",
          spendableBalance: new BigNumber(800),
          balances: mixed,
          pendingOperations: [],
        } as any,
        parentAccount: null,
        transaction: {} as any,
        filters: { private: false },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
  });

  it("bounds a send-max amount the coin states itself by the selected rows", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    estimateFeesMock.mockResolvedValue({ value: 10_000n, parameters: { amount: 40_000_000n } });

    const result = await estimate({
      account: makeAccount(),
      parentAccount: null,
      transaction: {} as any,
      filters: { pools: ["main"] },
    });

    // The "main" row holds 30,000,000 once its lock is out.
    expect(result.toString()).toBe("30000000");
  });

  it("refuses token rows of several pools that no single transaction can spend", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");
    const token = {
      type: "TokenAccount",
      spendableBalance: new BigNumber(800),
      balances: [
        { value: new BigNumber(100), pool: "main" },
        { value: new BigNumber(700), pool: "reserve" },
      ],
      pendingOperations: [],
    } as any;

    await expect(
      estimate({
        account: token,
        parentAccount: null,
        transaction: {} as any,
        filters: { private: false },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
  });

  it("refuses a token account that has no matching row", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");

    await expect(
      estimate({
        account: { type: "TokenAccount", spendableBalance: new BigNumber(5) } as any,
        parentAccount: null,
        transaction: {} as any,
        filters: { private: false },
      }),
    ).rejects.toBeInstanceOf(UnsupportedMaxSpendableFilter);
  });

  it("is unchanged without filters", async () => {
    const estimate = genericEstimateMaxSpendable("testnet", "local");

    const result = await estimate({
      account: makeAccount(),
      parentAccount: null,
      transaction: {} as any,
    });

    expect(result.toString()).toBe("49990000");
    expect(estimateFeesMock.mock.calls[0][1]).not.toHaveProperty("pool");
  });
});
