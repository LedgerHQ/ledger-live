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
    strategyLabel: "Medium",
    selectedFeeStrategy: null,
    displayOptions: [],
    canOpenSelector: false,
  })),
}));

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: jest.fn(),
}));

const { useSendFlowAmountReviewCore } = jest.requireMock(
  "@ledgerhq/live-common/flows/send/hooks/useSendFlowAmountReviewCore",
);
const { useAmountInputController } = jest.requireMock("../useAmountInputController");
const { useSponsoredSend } = jest.requireMock("../../../../context/SponsoredSendContext");

const SPONSORED_FEE = { value: "€2.80", secondaryValue: "3.2 USDT", originalValue: "€3.60" };

function mockSponsored({
  waivesNativeFee = false,
  reviewReady = true,
  available = false,
  selected = false,
  savingsFiatFormatted = null as string | null,
  sponsoredFeeAmounts = null as { sponsored: typeof SPONSORED_FEE } | null,
  sponsoredUnaffordable = false,
} = {}) {
  (useSponsoredSend as jest.Mock).mockReturnValue({
    waivesNativeFee,
    reviewReady,
    waivesErrorKeys: ["gasPrice"],
    waivesWarningKeys: ["amount"],
    available,
    sponsoredSelected: selected,
    providerName: "Provider",
    feeCurrencyTicker: "USDT",
    savingsFiatFormatted,
    sponsoredFeeAmounts,
    sponsoredUnaffordable,
  });
}

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
    mockSponsored();
  });

  const renderViewModel = (status: TransactionStatus) =>
    renderHook(() =>
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

  describe("with the sponsored fee", () => {
    const nativeFeeError = createNamedError("NotEnoughGas");
    const energyWarning = createNamedError("TronNotEnoughEnergy");
    const recipientError = createNamedError("InvalidAddress");
    const statusWithWaivable = () =>
      createBaseStatus({
        errors: { gasPrice: nativeFeeError, recipient: recipientError },
        warnings: { amount: energyWarning },
      });

    it("drops the errors and warnings it pays for", () => {
      mockSponsored({ waivesNativeFee: true });

      renderViewModel(statusWithWaivable());

      const coreStatus = (useSendFlowAmountReviewCore as jest.Mock).mock.calls[0][0].status;
      expect(Object.keys(coreStatus.errors)).toEqual(["recipient"]);
      expect(coreStatus.warnings).toEqual({});
    });

    it("keeps them while it doesn't pay the native fee", () => {
      mockSponsored({ waivesNativeFee: false });
      const status = statusWithWaivable();

      renderViewModel(status);

      expect((useSendFlowAmountReviewCore as jest.Mock).mock.calls[0][0].status).toBe(status);
    });

    it.each([
      [true, null],
      [false, "error"],
    ])("shows no native-fee message when waived (%s)", (waivesNativeFee, expectedType) => {
      mockSponsored({ waivesNativeFee });

      const { result } = renderViewModel(
        createBaseStatus({
          errors: { gasPrice: nativeFeeError },
          warnings: { amount: energyWarning },
        }),
      );

      if (!result.current.ready) throw new Error("view model should be ready");
      expect(result.current.message?.type ?? null).toBe(expectedType);
    });

    describe("fee payment entry", () => {
      const renderReady = () => {
        const { result } = renderViewModel(createBaseStatus());
        if (!result.current.ready) throw new Error("view model should be ready");
        return result.current;
      };

      it("is absent while the sponsored fee isn't offered", () => {
        mockSponsored({ available: false });

        expect(renderReady().sponsoredFee).toBeNull();
      });

      it("nudges toward the saving while the standard fee is picked", () => {
        mockSponsored({ available: true, savingsFiatFormatted: "€0.80" });

        expect(renderReady().sponsoredFee).toEqual({
          label: "send.newSendFlow.feePayment.nudge",
          selected: false,
          fee: null,
          infoDescription: null,
          error: null,
        });
      });

      it("offers paying in the fee token when there is no saving", () => {
        mockSponsored({ available: true });

        expect(renderReady().sponsoredFee?.label).toBe("send.newSendFlow.feePayment.payIn");
      });

      it("shows the sponsored fee, the saved badge and the disclaimer once picked", () => {
        mockSponsored({
          available: true,
          selected: true,
          savingsFiatFormatted: "€0.80",
          sponsoredFeeAmounts: { sponsored: SPONSORED_FEE },
        });

        expect(renderReady().sponsoredFee).toEqual({
          label: "send.newSendFlow.feePayment.saved",
          selected: true,
          fee: SPONSORED_FEE,
          infoDescription: "send.newSendFlow.feePayment.disclaimer",
          error: null,
        });
      });

      it("shows a pending fee and no badge while the picked option's quote reloads", () => {
        mockSponsored({ available: true, selected: true });

        expect(renderReady().sponsoredFee).toMatchObject({
          label: null,
          fee: { value: "-", secondaryValue: null, originalValue: null },
        });
      });

      it("blocks Review and says why while the fee token can't cover the send", () => {
        mockSponsored({ available: true, selected: true, sponsoredUnaffordable: true });

        const viewModel = renderReady();

        expect(viewModel.sponsoredFee?.error).toBe("send.newSendFlow.feePayment.insufficientFunds");
        expect(viewModel.reviewButton.disabled).toBe(true);
        expect(viewModel.reviewButton.loading).toBe(false);
      });

      it("keeps Get funds pressable when the amount itself exceeds the balance", () => {
        mockSponsored({ available: true, selected: true, sponsoredUnaffordable: true });
        (useSendFlowAmountReviewCore as jest.Mock).mockReturnValue({
          ...(useSendFlowAmountReviewCore as jest.Mock)(),
          hasInsufficientFundsError: true,
        });

        expect(renderReady().reviewButton.disabled).toBe(false);
      });
    });

    it("holds Review until the sponsored pick is ready", () => {
      mockSponsored({ reviewReady: false });

      const { result } = renderViewModel(createBaseStatus());

      if (!result.current.ready) throw new Error("view model should be ready");
      expect(result.current.reviewButton.disabled).toBe(true);
      expect(result.current.reviewButton.loading).toBe(true);
    });

    it("keeps Get funds pressable while the sponsored pick reloads its quote", () => {
      mockSponsored({ available: true, selected: true, reviewReady: false });
      (useSendFlowAmountReviewCore as jest.Mock).mockReturnValue({
        ...(useSendFlowAmountReviewCore as jest.Mock)(),
        hasInsufficientFundsError: true,
      });

      const { result } = renderViewModel(createBaseStatus());

      if (!result.current.ready) throw new Error("view model should be ready");
      expect(result.current.reviewButton.disabled).toBe(false);
      expect(result.current.reviewButton.loading).toBe(false);
    });
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
