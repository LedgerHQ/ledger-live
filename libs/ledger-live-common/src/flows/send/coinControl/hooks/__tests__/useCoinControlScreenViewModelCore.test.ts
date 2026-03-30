/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { NotEnoughBalance } from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react";
import type {
  CoinControlConfig,
  CoinControlDisplayData,
} from "../../../../../bridge/descriptor/types";
import { useCoinControlScreenViewModelCore } from "../useCoinControlScreenViewModelCore";
import type { Transaction, TransactionStatus } from "../../../../../generated/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getCryptoCurrencyById } from "../../../../../currencies";
import { bitcoinCoinControlConfig } from "../../../../../families/bitcoin/descriptor/coinControl";
import { bitcoinPickingStrategy } from "../../../../../families/bitcoin/types";

jest.mock("../../../../../bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: jest.fn((acc: AccountLike) => acc),
  getAccountCurrency: jest.fn((acc: AccountLike) => (acc as { currency: unknown }).currency),
}));
jest.mock("../../../../../bridge/descriptor/send/features", () => {
  const actual = jest.requireActual("../../../../../bridge/descriptor/send/features");
  return {
    ...actual,
    sendFeatures: {
      ...actual.sendFeatures,
      getCoinControlConfig: jest.fn(),
    },
  };
});
jest.mock("../useCoinControlAmountInput", () => ({
  useCoinControlAmountInput: () => ({
    amountValue: null,
    onAmountChange: jest.fn(),
    cancelPendingUpdates: jest.fn(),
    debounceTimeoutRef: { current: null },
  }),
}));
jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));

const mockOnLearnMore = jest.fn();

const { sendFeatures } = jest.requireMock("../../../../../bridge/descriptor/send/features") as {
  sendFeatures: { getCoinControlConfig: jest.Mock };
};
const mockGetCoinControlConfig = sendFeatures.getCoinControlConfig as jest.Mock;

function makeTestCoinControlConfig(
  getDisplayData: () => CoinControlDisplayData | null,
): CoinControlConfig {
  return {
    customStrategyValue: bitcoinCoinControlConfig.customStrategyValue,
    getDisplayData,
    buildStrategyChangePatch: bitcoinCoinControlConfig.buildStrategyChangePatch,
    buildToggleRowExclusionPatch: bitcoinCoinControlConfig.buildToggleRowExclusionPatch,
  };
}

const createAccount = (): AccountLike => {
  const currency = getCryptoCurrencyById("bitcoin");
  return {
    type: "Account",
    id: "bitcoin-account",
    name: "Bitcoin",
    currency,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    blockHeight: 800000,
    lastSyncDate: new Date(),
  } as unknown as AccountLike;
};

const createTransaction = (): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
  }) as unknown as Transaction;

const createStatus = (): TransactionStatus =>
  ({
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
  }) as TransactionStatus;

const mockLabels = {
  reviewCta: "Review",
  getCtaLabel: (currency: string) => `Get ${currency}`,
  strategyLabel: "Strategy",
  learnMoreLabel: "Learn more",
  coinToSendLabel: "Coin to send",
  changeToReturnLabel: "Change to return",
  enterAmountPlaceholder: "Enter amount",
  amountToSendLabel: "Amount to send",
  amountInputLabel: "Amount",
  getStrategyOptionLabel: (key: string) => key,
};

const row = (
  hash: string,
  outputIndex: number,
  excluded: boolean,
): CoinControlDisplayData["utxoRows"][number] => ({
  rowKey: `${hash}-${outputIndex}`,
  titleLabel: "#",
  formattedValue: "1 BTC",
  excluded,
  exclusionReason: excluded ? ("userExclusion" as const) : undefined,
  isUsedInTx: false,
  unconfirmed: false,
  disabled: false,
  confirmations: 1,
});

describe("useCoinControlScreenViewModelCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCoinControlConfig.mockImplementation(() => null);
  });

  it("returns expected shape with minimal params", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const account = createAccount();
    const transaction = createTransaction();
    const status = createStatus();
    const updateTransaction = jest.fn((fn: (tx: Transaction) => Transaction) => fn(transaction));
    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction,
        status,
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: undefined,
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current).toMatchObject({
      amountError: undefined,
      reviewShowIcon: true,
      strategyLabel: "Strategy",
      learnMoreLabel: "Learn more",
    });
    expect(typeof result.current.onAmountChange).toBe("function");
    expect(typeof result.current.onSelectStrategy).toBe("function");
    expect(result.current.onLearnMoreClick).toBe(mockOnLearnMore);
    expect(result.current.onToggleUtxoExclusion).toBeUndefined();
  });

  it("exposes onToggleUtxoExclusion only for CUSTOM strategy", () => {
    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();
    const customTx = {
      ...createTransaction(),
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    mockGetCoinControlConfig.mockReturnValue(
      makeTestCoinControlConfig(() => ({
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 0,
        totalSpent: new BigNumber(0),
        utxoRows: [
          {
            rowKey: "tx1-0",
            titleLabel: "#1",
            formattedValue: "1000 BTC",
            excluded: false,
            exclusionReason: undefined,
            isUsedInTx: false,
            unconfirmed: false,
            disabled: false,
            confirmations: 1,
          },
        ],
      })),
    );

    const updateTransaction = jest.fn((fn: (tx: Transaction) => Transaction) => fn(customTx));

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status: createStatus(),
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: undefined,
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.onToggleUtxoExclusion).toEqual(expect.any(Function));
    result.current.onToggleUtxoExclusion?.("tx1-0");
    expect(updateTransaction).toHaveBeenCalled();
  });

  it("calls onLearnMoreClick when passed", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();
    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status: createStatus(),
        bridgePending: false,
        uiConfig: {} as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: undefined,
        networkFees: { fee: "data" },
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    result.current.onLearnMoreClick();
    expect(mockOnLearnMore).toHaveBeenCalledTimes(1);
    expect(result.current.networkFees).toEqual({ fee: "data" });
  });

  it("hides amountError for CUSTOM strategy when amount is not filled", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();
    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(0),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status: createStatus(),
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: "Some amount error",
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.amountError).toBeUndefined();
  });

  it("still shows amountError for CUSTOM strategy when amount is filled", () => {
    mockGetCoinControlConfig.mockReturnValue(makeTestCoinControlConfig(() => null));

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();
    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(1000),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status: createStatus(),
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: "Some amount error",
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.amountError).toBe("Some amount error");
  });

  it("hides NotEnoughBalance when CUSTOM, amount filled, and no UTXO is selected", () => {
    mockGetCoinControlConfig.mockReturnValue(
      makeTestCoinControlConfig(() => ({
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 2,
        totalSpent: new BigNumber(0),
        utxoRows: [row("tx1", 0, true), row("tx2", 1, true)],
      })),
    );

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();

    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(5000),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const status = {
      ...createStatus(),
      errors: {
        amount: new NotEnoughBalance("Insufficient funds"),
      },
    } as unknown as TransactionStatus;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status,
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: "Insufficient funds",
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.amountError).toBeUndefined();
    expect(result.current.changeToReturnFormatted).toBe("");
    expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
  });

  it("still shows NotEnoughBalance for CUSTOM when at least one UTXO is selected", () => {
    mockGetCoinControlConfig.mockReturnValue(
      makeTestCoinControlConfig(() => ({
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 1,
        totalSpent: new BigNumber(0),
        utxoRows: [row("tx1", 0, false), row("tx2", 1, true)],
      })),
    );

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();

    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(5000),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const status = {
      ...createStatus(),
      errors: {
        amount: new NotEnoughBalance("Insufficient funds"),
      },
    } as unknown as TransactionStatus;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status,
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: "Insufficient funds",
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.amountError).toBe("Insufficient funds");
    expect(result.current.changeToReturnFormatted).toBe("");
    expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
  });

  it("hides NotEnoughBalance for CUSTOM while bridgePending (stale status after UTXO toggle)", () => {
    mockGetCoinControlConfig.mockReturnValue(
      makeTestCoinControlConfig(() => ({
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 1,
        totalSpent: new BigNumber(0),
        utxoRows: [row("tx1", 0, false), row("tx2", 1, true)],
      })),
    );

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();

    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(5000),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const status = {
      ...createStatus(),
      errors: {
        amount: new NotEnoughBalance("Insufficient funds"),
      },
    } as unknown as TransactionStatus;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status,
        bridgePending: true,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: "Insufficient funds",
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.amountError).toBeUndefined();
  });

  it("formats change to return for CUSTOM when selection covers amount and there is no NotEnoughBalance", () => {
    mockGetCoinControlConfig.mockReturnValue(
      makeTestCoinControlConfig(() => ({
        pickingStrategyOptions: [],
        pickingStrategyValue: bitcoinPickingStrategy.CUSTOM,
        totalExcludedUTXOS: 0,
        totalSpent: new BigNumber(0),
        utxoRows: [row("tx1", 0, false), row("tx2", 1, false)],
      })),
    );

    const getAccountBridge = jest.requireMock("../../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
    });
    const account = createAccount();

    const customTx = {
      ...createTransaction(),
      amount: new BigNumber(5000),
      useAllAmount: false,
      utxoStrategy: { strategy: bitcoinPickingStrategy.CUSTOM, excludeUTXOs: [] },
    } as unknown as Transaction;

    const status = {
      ...createStatus(),
      errors: {},
      txOutputs: [{ isChange: true, value: new BigNumber(3500) }],
    } as unknown as TransactionStatus;

    const { result } = renderHook(() =>
      useCoinControlScreenViewModelCore({
        account,
        parentAccount: null,
        transaction: customTx,
        status,
        bridgePending: false,
        uiConfig: { hasCoinControl: true } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        locale: "en",
        accountUnit: getAccountCurrency(account).units[0],
        amountError: undefined,
        networkFees: {},
        labels: mockLabels,
        onLearnMoreClick: mockOnLearnMore,
      }),
    );

    expect(result.current.changeToReturnFormatted).toBe("3500 BTC");
    expect(result.current.enterAmountPlaceholder).toBe("Enter amount");
  });
});
