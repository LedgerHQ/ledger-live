/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { useCoinControlScreenViewModel } from "../useCoinControlScreenViewModel";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { bitcoinPickingStrategy } from "@ledgerhq/live-common/families/bitcoin/types";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/coin-framework/account/helpers");
jest.mock("@ledgerhq/coin-framework/currencies/formatCurrencyUnit", () => ({
  formatCurrencyUnit: jest.fn((_unit: unknown, value: BigNumber) => `${value.toString()} BTC`),
}));
jest.mock("~/renderer/hooks/useAccountUnit", () => ({
  useMaybeAccountUnit: jest.fn(() => ({ magnitude: 8, code: "BTC", name: "Bitcoin" })),
}));
const defaultInitialState = {
  settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD", locale: "en" as const },
};

const mockUpdateTransaction = jest.fn();
const mockOnAmountChange = jest.fn();

jest.mock("../../../../hooks/useInitialTransactionPreparation");
jest.mock("../../../../hooks/useNetworkFees", () => ({
  useNetworkFees: () => ({
    feesRowLabel: "Network Fees",
    feesRowValue: "--",
    feesRowStrategyLabel: "Medium",
    showNetworkFees: true,
    showFeePresets: false,
    selectedFeeStrategy: null,
    onSelectFeeStrategy: jest.fn(),
    feePresetOptions: [],
    fiatByPreset: {},
    legendByPreset: {},
  }),
}));
jest.mock("../../../Recipient/hooks/useTranslatedBridgeError", () => ({
  useTranslatedBridgeError: jest.fn(() => null),
}));
jest.mock("../useBitcoinUtxoDisplayData", () => ({
  useBitcoinUtxoDisplayData: () => ({
    pickingStrategyValue: bitcoinPickingStrategy.MERGE_OUTPUTS,
    pickingStrategyOptions: [
      { value: String(bitcoinPickingStrategy.MERGE_OUTPUTS), labelKey: "merge" },
      { value: String(bitcoinPickingStrategy.OPTIMIZE_SIZE), labelKey: "optimize" },
    ],
    utxoRows: [],
    totalExcludedUTXOS: 0,
    totalSpent: new BigNumber(0),
  }),
}));
jest.mock("../useCoinControlAmountInput", () => ({
  useCoinControlAmountInput: () => ({
    amountValue: "0",
    onAmountChange: mockOnAmountChange,
    cancelPendingUpdates: jest.fn(),
    debounceTimeoutRef: { current: null },
  }),
}));
jest.mock("~/config/urls", () => ({
  urls: { coinControl: "https://support.ledger.com/coin-control" },
}));
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const { getMainAccount, getAccountCurrency } = jest.requireMock(
  "@ledgerhq/coin-framework/account/helpers",
);
const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");
const { useTranslatedBridgeError } = jest.requireMock(
  "../../../Recipient/hooks/useTranslatedBridgeError",
);
const { openURL: mockOpenURL } = jest.requireMock("~/renderer/linking");

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

function createTransactionStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
    ...overrides,
  } as TransactionStatus;
}

function isAccount(account: unknown): account is Account {
  return (
    typeof account === "object" &&
    account !== null &&
    "type" in account &&
    (account as Account).type === "Account"
  );
}

function buildBaseParams(overrides?: {
  account?: Partial<Account>;
  transaction?: Partial<Transaction>;
  status?: Partial<TransactionStatus>;
  bridgePending?: boolean;
}) {
  const currency = getCryptoCurrencyById("bitcoin");
  const account = createMockAccount({
    id: "bitcoin-account",
    currency,
    ...overrides?.account,
  });

  getMainAccount.mockImplementation((acc: Account | unknown) => {
    if (!isAccount(acc)) throw new Error("TokenAccount not supported");
    return acc;
  });
  getAccountCurrency.mockReturnValue(currency);
  getAccountBridge.mockReturnValue({
    updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...tx,
      ...patch,
    }),
  });

  const transaction = createBitcoinTransaction(overrides?.transaction);
  const status = createTransactionStatus(overrides?.status);

  return {
    account,
    parentAccount: null as Account | null,
    transaction,
    status,
    bridgePending: overrides?.bridgePending ?? false,
    bridgeError: null as Error | null,
    uiConfig: { hasFeePresets: false } as never,
    transactionActions: { updateTransaction: mockUpdateTransaction } as never,
  };
}

describe("useCoinControlScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTransaction.mockImplementation((fn: (tx: Transaction) => Transaction) => {
      const tx = createBitcoinTransaction();
      return fn(tx);
    });
  });

  it("should return the expected view model shape", () => {
    const params = buildBaseParams();

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current).toMatchObject({
      amountValue: "0",
      amountError: undefined,
      reviewShowIcon: true,
      reviewDisabled: true,
      reviewLoading: false,
    });
    expect(typeof result.current.onAmountChange).toBe("function");
    expect(typeof result.current.onSelectStrategy).toBe("function");
    expect(typeof result.current.onLearnMoreClick).toBe("function");
    expect(result.current.strategyOptionsWithLabels).toBeDefined();
    expect(result.current.utxoDisplayData).toBeDefined();
    expect(result.current.changeToReturnFormatted).toBe("");
    expect(result.current.reviewLabel).toBeDefined();
    expect(result.current.learnMoreLabel).toBeDefined();
    expect(result.current.coinToSendLabel).toBeDefined();
    expect(result.current.changeToReturnLabel).toBeDefined();
    expect(result.current.enterAmountPlaceholder).toBeDefined();
    expect(result.current.amountToSendLabel).toBeDefined();
    expect(result.current.feesRowLabel).toBe("Network Fees");
  });

  it("should set reviewLabel to getCta when hasInsufficientFundsError", () => {
    (useTranslatedBridgeError as jest.Mock).mockReturnValue({
      title: "Not enough balance",
      description: "",
    });
    const params = buildBaseParams({
      status: {
        errors: {
          amount: { name: "NotEnoughBalance", message: "" } as Error,
        },
      },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.reviewLabel).toMatch(/get/i);
    expect(result.current.reviewShowIcon).toBe(false);
  });

  it("should set reviewLabel to reviewCta when no insufficient funds error", () => {
    (useTranslatedBridgeError as jest.Mock).mockReturnValue(null);
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(1000), recipient: "bc1q" },
      status: { errors: {} },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.reviewLabel).toMatch(/review/i);
    expect(result.current.reviewShowIcon).toBe(true);
  });

  it("should disable review when has errors and not insufficient funds", () => {
    (useTranslatedBridgeError as jest.Mock).mockReturnValue({
      title: "Invalid address",
      description: "",
    });
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(1000), recipient: "bc1q" },
      status: {
        errors: {
          recipient: { name: "InvalidAddress", message: "" } as Error,
        },
      },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.reviewDisabled).toBe(true);
  });

  it("should disable review when no amount entered", () => {
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(0), useAllAmount: false },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.reviewDisabled).toBe(true);
  });

  it("should set reviewLoading when bridgePending and shouldPrepare", () => {
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(1000), recipient: "bc1qxy" },
      bridgePending: true,
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.reviewLoading).toBe(true);
  });

  it("should return empty changeToReturnFormatted when no amount", () => {
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(0), useAllAmount: false },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.changeToReturnFormatted).toBe("");
  });

  it("should format change to return when status has txOutputs with change", () => {
    const params = buildBaseParams({
      transaction: { amount: new BigNumber(5000), recipient: "bc1q", useAllAmount: false },
      status: {
        txOutputs: [
          { isChange: false, value: new BigNumber(5000) },
          { isChange: true, value: new BigNumber(2000) },
        ],
      } as TransactionStatus,
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.changeToReturnFormatted).toBe("2000 BTC");
  });

  it("should expose onSelectStrategy that accepts a strategy value without throwing", () => {
    const params = buildBaseParams({
      transaction: createBitcoinTransaction({
        amount: new BigNumber(1000),
        utxoStrategy: {
          strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
          excludeUTXOs: [],
        },
      }),
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(typeof result.current.onSelectStrategy).toBe("function");
    expect(() => {
      result.current.onSelectStrategy(String(bitcoinPickingStrategy.OPTIMIZE_SIZE));
    }).not.toThrow();
  });

  it("should open coin control URL when onLearnMoreClick is called", () => {
    const params = buildBaseParams();

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    result.current.onLearnMoreClick();

    expect(mockOpenURL).toHaveBeenCalledWith("https://support.ledger.com/coin-control");
  });

  it("should not call updateTransaction when onSelectStrategy receives invalid value", () => {
    const params = buildBaseParams();

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    const callCountBefore = mockUpdateTransaction.mock.calls.length;
    result.current.onSelectStrategy("not-a-number");
    expect(mockUpdateTransaction.mock.calls.length).toBe(callCountBefore);
  });

  it("should expose amountError from useTranslatedBridgeError when not AmountRequired", () => {
    (useTranslatedBridgeError as jest.Mock).mockReturnValue({
      title: "DustLimit",
      description: "Amount below dust",
    });
    const params = buildBaseParams({
      status: {
        errors: {
          amount: { name: "DustLimit", message: "" } as Error,
        },
      },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.amountError).toBe("DustLimit");
  });

  it("should not expose amountError when error is AmountRequired", () => {
    (useTranslatedBridgeError as jest.Mock).mockReturnValue({
      title: "AmountRequired",
      description: "",
    });
    const params = buildBaseParams({
      status: {
        errors: {
          amount: { name: "AmountRequired", message: "" } as Error,
        },
      },
    });

    const { result } = renderHook(() => useCoinControlScreenViewModel(params), {
      initialState: defaultInitialState,
    });

    expect(result.current.amountError).toBeUndefined();
  });
});
