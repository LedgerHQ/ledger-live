/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { renderHook } from "@testing-library/react-native";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { FeeTooHigh } from "@ledgerhq/ledger-wallet-framework/errors";
import { DustLimit } from "@ledgerhq/coin-bitcoin/errors";
import { useAmountScreenViewModel } from "../useAmountScreenViewModel";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useLocale: () => ({ locale: "en" }),
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
    secondaryValue: null,
    secondaryValueStrikethrough: false,
    strategyLabel: "Medium",
    selectedFeeStrategy: null,
    displayOptions: [],
    canOpenSelector: false,
    networkFeesInfo: null,
    tronify: null,
  })),
}));

jest.mock("@ledgerhq/live-currency-format", () => ({
  formatCurrencyUnit: jest.fn((unit: { code: string }) =>
    unit.code === "USDT" ? "0.12 USDT" : "1.50 TRX",
  ),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getAccountCurrency: jest.fn((acc: { currency: unknown }) => acc.currency),
}));

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: jest.fn(),
}));

const { useSendFlowAmountReviewCore } = jest.requireMock(
  "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore",
);
const { useAmountInputController } = jest.requireMock("../useAmountInputController");
const { useSponsoredSend } = jest.requireMock("../../../../context/SponsoredSendContext");

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

// Tronify-specific mock accounts and quote
const mockTronAccount = {
  id: "tron-account",
  balance: new BigNumber(50_000_000),
  currency: {
    id: "tron",
    type: "CryptoCurrency",
    family: "tron",
    name: "Tron",
    ticker: "TRX",
    units: [{ code: "TRX", magnitude: 6, name: "Tron" }],
  },
  type: "Account",
} as unknown as Account;

const mockTokenAccount = {
  id: "usdt-token-account",
  balance: new BigNumber(10_000_000),
  spendableBalance: new BigNumber(10_000_000),
  currency: {
    id: "tron/trc10/usdt",
    type: "TokenCurrency",
    name: "Tether USD",
    ticker: "USDT",
    units: [{ code: "USDT", magnitude: 6, name: "Tether USD" }],
  },
  type: "TokenAccount",
  parentId: "tron-account",
} as unknown as Account;

const mockQuote = {
  value: BigInt(120_000),
  originalValue: BigInt(1_500_000),
  savings: BigInt(1_380_000),
};

const mockSponsoredSendNotAvailable = {
  selectedFeeOptionId: "standard" as const,
  selectTronify: jest.fn(),
  selectStandard: jest.fn(),
  available: false,
  quote: null,
  savingsFiatFormatted: null,
  feeCurrencyTicker: "TRX",
  feeLoading: false,
  state: {} as never,
  actions: {} as never,
};

const mockSponsoredSendAvailableStandard = {
  ...mockSponsoredSendNotAvailable,
  available: true,
  quote: mockQuote,
  savingsFiatFormatted: "$1.38",
};

const mockSponsoredSendAvailableTronify = {
  ...mockSponsoredSendAvailableStandard,
  selectedFeeOptionId: "tronify" as const,
};

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
    (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendNotAvailable);
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

  describe("Tronify integration", () => {
    const tronifyParams = {
      parentAccount: mockTronAccount,
      transaction: { ...baseTransaction, amount: new BigNumber(1_000_000) } as unknown as typeof baseTransaction,
      status: createBaseStatus(),
      bridgePending: false,
      bridgeError: null,
      uiConfig: { hasFeePresets: false } as never,
      transactionActions: { updateTransaction: jest.fn() } as never,
      onReview: jest.fn(),
      onGetFunds: jest.fn(),
    };

    beforeEach(() => {
      (useSendFlowAmountReviewCore as jest.Mock).mockReturnValue({
        mainAccount: mockTronAccount,
        accountCurrency: mockTronAccount.currency,
        updateTransactionWithPatch: jest.fn(),
        maxAvailable: new BigNumber(9_000_000),
        reviewLabel: "Review",
        reviewShowIcon: true,
        reviewDisabled: false,
        amountComputationPending: false,
        hasInsufficientFundsError: false,
        hasRawAmount: true,
      });
    });

    it("exposes tronify as null when Tronify is not available", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendNotAvailable);

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account: mockTokenAccount }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      expect(result.current.networkFees.tronify).toBeNull();
      expect(result.current.reviewButton.disabled).toBe(false);
    });

    it("exposes tronify view model when available with standard selected", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendAvailableStandard);

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account: mockTokenAccount }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      expect(result.current.networkFees.tronify).not.toBeNull();
      expect(result.current.networkFees.tronify?.selected).toBe(false);
      // fee row values unchanged when standard is selected
      expect(result.current.networkFees.value).toBe("0.25 EUR");
      expect(result.current.networkFees.secondaryValueStrikethrough).toBe(false);
      expect(result.current.reviewButton.disabled).toBe(false);
    });

    it("overrides fee row fields when Tronify is selected", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendAvailableTronify);

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account: mockTokenAccount }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      const fees = result.current.networkFees;
      expect(fees.value).toBe("0.12 USDT");
      expect(fees.secondaryValue).toBe("1.50 TRX");
      expect(fees.secondaryValueStrikethrough).toBe(true);
      expect(fees.strategyLabel).toBe("send.newSendFlow.feeSelector.viaTronify");
      expect(fees.displayOptions).toEqual([]);
      expect(fees.canOpenSelector).toBe(true);
    });

    it("does not block Review when Tronify is selected with sufficient balance", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendAvailableTronify);
      // spendableBalance 10_000_000 > amount 1_000_000 + fee 120_000
      const account = { ...mockTokenAccount, spendableBalance: new BigNumber(10_000_000) } as unknown as Account;

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      expect(result.current.networkFees.tronify?.insufficientBalance).toBe(false);
      expect(result.current.reviewButton.disabled).toBe(false);
    });

    it("blocks Review when Tronify is selected with insufficient balance", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendAvailableTronify);
      // spendableBalance 100_000 < amount 1_000_000 + fee 120_000
      const account = { ...mockTokenAccount, spendableBalance: new BigNumber(100_000) } as unknown as Account;

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      expect(result.current.networkFees.tronify?.insufficientBalance).toBe(true);
      expect(result.current.reviewButton.disabled).toBe(true);
    });

    it("does not flag insufficientBalance when standard is selected regardless of balance", () => {
      (useSponsoredSend as jest.Mock).mockReturnValue(mockSponsoredSendAvailableStandard);
      // low balance that would fail the Tronify check
      const account = { ...mockTokenAccount, spendableBalance: new BigNumber(100_000) } as unknown as Account;

      const { result } = renderHook(() =>
        useAmountScreenViewModel({ ...tronifyParams, account }),
      );

      expect(result.current.ready).toBe(true);
      if (!result.current.ready) throw new Error("view model should be ready");

      expect(result.current.networkFees.tronify?.insufficientBalance).toBe(false);
      expect(result.current.reviewButton.disabled).toBe(false);
    });
  });
});
