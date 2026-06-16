/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { DustLimit, FeeTooHigh } from "@ledgerhq/errors";
import { useAmountScreenViewModel } from "../useAmountScreenViewModel";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore", () => ({
  useSendFlowAmountReviewCore: jest.fn(),
}));

jest.mock("../useAmountInputController", () => ({
  useAmountInputController: jest.fn(),
}));

jest.mock("../useQuickActions", () => ({
  useQuickActions: jest.fn(() => []),
}));

jest.mock("../../../../hooks/useNetworkFees", () => ({
  useNetworkFees: jest.fn(() => ({
    label: "Network fees",
    value: "0.25 EUR",
    showNetworkFees: true,
    showFeePresets: false,
    selectedFeeStrategy: null,
    onSelectFeeStrategy: jest.fn(),
    feePresetLabelsOptions: [],
    fiatByPreset: {},
    legendByPreset: {},
  })),
}));

const { useSendFlowAmountReviewCore } = jest.requireMock(
  "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore",
);
const { useAmountInputController } = jest.requireMock("../useAmountInputController");

const mockAccount = {
  id: "mock-account",
  balance: new BigNumber(100_000_000),
  currency: {
    id: "bitcoin",
    type: "CryptoCurrency",
    family: "bitcoin",
    name: "Bitcoin",
    ticker: "BTC",
    units: [{ code: "BTC", magnitude: 8, name: "Bitcoin" }],
  },
  type: "Account",
} as unknown as Account;

const baseTransaction = {
  family: "bitcoin",
  amount: new BigNumber(0),
  recipient: "bc1qtest",
  useAllAmount: false,
} as unknown as Transaction;

const createBaseStatus = (overrides?: Partial<TransactionStatus>) =>
  ({
    amount: new BigNumber(0),
    estimatedFees: new BigNumber(1000),
    errors: {},
    warnings: {},
    ...overrides,
  }) as TransactionStatus;

function createNamedError(name: string): Error {
  const error = new Error("");
  error.name = name;
  return error;
}

const baseAmountInputController = {
  value: "0.1",
  currencyText: "EUR",
  currencyPosition: "left" as const,
  secondaryValue: "0.00000163 BTC",
  maxDecimalLength: 2,
  isDisabled: false,
  isTyping: false,
  onChangeText: jest.fn(),
  onToggleMode: jest.fn(),
  updateBothInputs: jest.fn(),
  cancelPendingUpdates: jest.fn(),
};

describe("useAmountScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useSendFlowAmountReviewCore as jest.Mock).mockReturnValue({
      mainAccount: mockAccount,
      accountCurrency: mockAccount.currency,
      updateTransactionWithPatch: jest.fn(),
      maxAvailable: new BigNumber(90_000_000),
      reviewLabel: "Review",
      reviewShowIcon: true,
      reviewDisabled: false,
      amountComputationPending: false,
      hasInsufficientFundsError: false,
      hasRawAmount: true,
    });

    (useAmountInputController as jest.Mock).mockReturnValue(baseAmountInputController);
  });

  it("prioritizes blocking errors over fee info messages", () => {
    const dustLimitError = new DustLimit();

    const status = createBaseStatus({
      errors: { dustLimit: dustLimitError },
      warnings: { feeTooHigh: new FeeTooHigh() },
    });

    const { result } = renderHook(() =>
      useAmountScreenViewModel({
        account: mockAccount,
        parentAccount: null,
        transaction: baseTransaction,
        status,
        bridgePending: false,
        bridgeError: null,
        uiConfig: { hasFeePresets: false } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        onReview: jest.fn(),
        onGetFunds: jest.fn(),
        onSelectCoinControl: jest.fn(),
      }),
    );

    expect(result.current.ready).toBe(true);
    if (!result.current.ready) {
      throw new Error("view model should be ready");
    }

    expect(result.current.message).toEqual({
      type: "error",
      error: dustLimitError,
    });
  });

  it("keeps fee-too-high as info when no blocking error exists", () => {
    const feeTooHighWarning = new FeeTooHigh();
    const status = createBaseStatus({
      warnings: { feeTooHigh: feeTooHighWarning },
    });

    const { result } = renderHook(() =>
      useAmountScreenViewModel({
        account: mockAccount,
        parentAccount: null,
        transaction: baseTransaction,
        status,
        bridgePending: false,
        bridgeError: null,
        uiConfig: { hasFeePresets: false } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        onReview: jest.fn(),
        onGetFunds: jest.fn(),
        onSelectCoinControl: jest.fn(),
      }),
    );

    expect(result.current.ready).toBe(true);
    if (!result.current.ready) {
      throw new Error("view model should be ready");
    }

    expect(result.current.message).toEqual({
      type: "info",
      error: feeTooHighWarning,
    });
  });

  it("disables the amount input for an input-blocking recipient error", () => {
    const recipientError = createNamedError("SourceHasMultiSign");
    const status = createBaseStatus({
      errors: { recipient: recipientError },
    });

    const { result } = renderHook(() =>
      useAmountScreenViewModel({
        account: mockAccount,
        parentAccount: null,
        transaction: baseTransaction,
        status,
        bridgePending: false,
        bridgeError: null,
        uiConfig: { hasFeePresets: false } as never,
        transactionActions: { updateTransaction: jest.fn() } as never,
        onReview: jest.fn(),
        onGetFunds: jest.fn(),
        onSelectCoinControl: jest.fn(),
      }),
    );

    expect(result.current.ready).toBe(true);
    if (!result.current.ready) {
      throw new Error("view model should be ready");
    }

    expect(result.current.amountInput.isDisabled).toBe(true);
    expect(result.current.message).toEqual({
      type: "error",
      error: recipientError,
    });
  });
});
