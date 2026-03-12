/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import {
  useBitcoinUtxoDisplayData,
  type UseBitcoinUtxoDisplayDataParams,
} from "../useBitcoinUtxoDisplayData";
import type { BitcoinAccount, BitcoinOutput } from "@ledgerhq/live-common/families/bitcoin/types";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

jest.mock("@ledgerhq/live-common/families/bitcoin/logic", () => ({
  getUTXOStatus: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const getUTXOStatus = jest.requireMock(
  "@ledgerhq/live-common/families/bitcoin/logic",
).getUTXOStatus;

function createBitcoinAccount(overrides?: Partial<BitcoinAccount>): BitcoinAccount {
  const currency = getCryptoCurrencyById("bitcoin");
  const account = createMockAccount({
    id: "bitcoin-account",
    currency,
    blockHeight: 800000,
    ...overrides,
  });
  return account as BitcoinAccount;
}

function createUtxo(overrides?: Partial<BitcoinOutput>): BitcoinOutput {
  return {
    hash: "abc123",
    outputIndex: 0,
    blockHeight: 799000,
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    value: new BigNumber(10000),
    rbf: false,
    isChange: false,
    ...overrides,
  };
}

function createBitcoinTransaction(overrides?: Partial<Transaction>): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: {
      strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
      excludeUTXOs: [],
    },
    ...overrides,
  } as Transaction;
}

function createBitcoinStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(5000),
    txInputs: [],
    ...overrides,
  } as TransactionStatus;
}

describe("useBitcoinUtxoDisplayData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUTXOStatus as jest.Mock).mockReturnValue({ excluded: false });
  });

  it("should return null when account is not Bitcoin-based", () => {
    const account = createMockAccount({
      id: "eth-account",
      currency: getCryptoCurrencyById("ethereum"),
    });
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction: createBitcoinTransaction(),
      status: createBitcoinStatus(),
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).toBeNull();
    expect(getUTXOStatus).not.toHaveBeenCalled();
  });

  it("should return null when account has no bitcoinResources", () => {
    const account = createMockAccount({
      id: "bitcoin-account",
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction: createBitcoinTransaction(),
      status: createBitcoinStatus(),
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).toBeNull();
  });

  it("should return null when transaction has no utxoStrategy", () => {
    const account = createBitcoinAccount({
      bitcoinResources: {
        utxos: [createUtxo()],
      },
    });
    const transactionWithoutStrategy = {
      ...createBitcoinTransaction(),
      utxoStrategy: undefined,
    };
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction: transactionWithoutStrategy as Transaction,
      status: createBitcoinStatus(),
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).toBeNull();
  });

  it("should return null when status has no txInputs (not Bitcoin transaction status)", () => {
    const account = createBitcoinAccount({
      bitcoinResources: {
        utxos: [createUtxo()],
      },
    });
    const statusWithoutTxInputs = createBitcoinStatus();
    delete (statusWithoutTxInputs as Record<string, unknown>).txInputs;
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction: createBitcoinTransaction(),
      status: statusWithoutTxInputs,
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).toBeNull();
  });

  it("should return null when bitcoinResources has no utxos", () => {
    const account = createBitcoinAccount({
      bitcoinResources: {
        utxos: [],
      },
    });
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction: createBitcoinTransaction(),
      status: createBitcoinStatus(),
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).toBeNull();
  });

  it("should return display data with correct shape when all conditions are met", () => {
    const utxo = createUtxo();
    const account = createBitcoinAccount({
      bitcoinResources: {
        utxos: [utxo],
      },
      blockHeight: 800000,
    });
    const transaction = createBitcoinTransaction();
    const status = createBitcoinStatus({ totalSpent: new BigNumber(3000) });
    const params: UseBitcoinUtxoDisplayDataParams = {
      account,
      transaction,
      status,
      locale: "en",
    };

    const { result } = renderHook(() => useBitcoinUtxoDisplayData(params));

    expect(result.current).not.toBeNull();
    expect(result.current).toMatchObject({
      pickingStrategyValue: bitcoinPickingStrategy.MERGE_OUTPUTS,
      totalExcludedUTXOS: 0,
      totalSpent: new BigNumber(3000),
    });
    expect(result.current?.pickingStrategyOptions).toHaveLength(3);
    expect(result.current?.utxoRows).toHaveLength(1);
    expect(getUTXOStatus).toHaveBeenCalledWith(
      utxo,
      (transaction as { utxoStrategy: unknown }).utxoStrategy,
    );
  });

  it("should compute totalExcludedUTXOS from getUTXOStatus results", () => {
    const utxo1 = createUtxo({ outputIndex: 0 });
    const utxo2 = createUtxo({ hash: "def456", outputIndex: 1 });
    const account = createBitcoinAccount({
      bitcoinResources: {
        utxos: [utxo1, utxo2],
      },
    });
    (getUTXOStatus as jest.Mock).mockImplementation((u: BitcoinOutput) => ({
      excluded: u.outputIndex === 1,
      reason: u.outputIndex === 1 ? ("userExclusion" as const) : undefined,
    }));

    const { result } = renderHook(() =>
      useBitcoinUtxoDisplayData({
        account,
        transaction: createBitcoinTransaction(),
        status: createBitcoinStatus(),
        locale: "en",
      }),
    );

    expect(result.current).not.toBeNull();
    expect(result.current?.totalExcludedUTXOS).toBe(1);
    expect(result.current?.utxoRows[0].excluded).toBe(false);
    expect(result.current?.utxoRows[1].excluded).toBe(true);
    expect(result.current?.utxoRows[1].exclusionReason).toBe("userExclusion");
  });

  it("should set isUsedInTx when utxo matches txInputs", () => {
    const utxo = createUtxo({ hash: "txHash1", outputIndex: 2 });
    const account = createBitcoinAccount({
      bitcoinResources: { utxos: [utxo] },
    });
    const status = createBitcoinStatus({
      txInputs: [
        {
          address: null,
          value: null,
          previousTxHash: "txHash1",
          previousOutputIndex: 2,
        },
      ],
    });

    const { result } = renderHook(() =>
      useBitcoinUtxoDisplayData({
        account,
        transaction: createBitcoinTransaction(),
        status,
        locale: "en",
      }),
    );

    expect(result.current?.utxoRows[0].isUsedInTx).toBe(true);
  });

  it("should set unconfirmed and disabled when exclusion reason is pickPendingUtxo", () => {
    const utxo = createUtxo({ blockHeight: undefined, isChange: false });
    const account = createBitcoinAccount({
      bitcoinResources: { utxos: [utxo] },
    });
    (getUTXOStatus as jest.Mock).mockReturnValue({
      excluded: true,
      reason: "pickPendingUtxo",
    });

    const { result } = renderHook(() =>
      useBitcoinUtxoDisplayData({
        account,
        transaction: createBitcoinTransaction(),
        status: createBitcoinStatus(),
        locale: "en",
      }),
    );

    expect(result.current?.utxoRows[0].unconfirmed).toBe(true);
    expect(result.current?.utxoRows[0].disabled).toBe(true);
    expect(result.current?.utxoRows[0].exclusionReason).toBe("pickPendingUtxo");
  });

  it("should format utxo value with locale", () => {
    const utxo = createUtxo({ value: new BigNumber(250000) });
    const account = createBitcoinAccount({
      bitcoinResources: { utxos: [utxo] },
    });

    const { result } = renderHook(() =>
      useBitcoinUtxoDisplayData({
        account,
        transaction: createBitcoinTransaction(),
        status: createBitcoinStatus(),
        locale: "fr",
      }),
    );

    expect(result.current?.utxoRows[0].formattedValue).toBe("250000 BTC");
  });

  it("should use totalSpent from status or default to zero", () => {
    const account = createBitcoinAccount({
      bitcoinResources: { utxos: [createUtxo()] },
    });
    const statusWithNoSpent = createBitcoinStatus({ totalSpent: undefined });

    const { result } = renderHook(() =>
      useBitcoinUtxoDisplayData({
        account,
        transaction: createBitcoinTransaction(),
        status: statusWithNoSpent,
        locale: "en",
      }),
    );

    expect(result.current?.totalSpent).toEqual(new BigNumber(0));
  });
});
