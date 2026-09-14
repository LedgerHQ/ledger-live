/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useAmountScreenViewModel } from "../useAmountScreenViewModel";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import {
  getAccountCurrency,
  getMainAccount,
} from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { useTranslatedBridgeError } from "../../../Recipient/hooks/useTranslatedBridgeError";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { useSponsoredSend } from "../../../../context/SponsoredSendContext";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");
jest.mock("@ledgerhq/live-common/bridge/descriptor/registry", () => ({
  getSendDescriptor: jest.fn(),
}));
jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features", () => ({
  sendFeatures: {
    hasFeePresets: () => false,
    shouldEstimateFeePresetsWithBridge: () => false,
    getFeePresetFallbackIds: () => [],
    canEstimateFeePresetsWithZeroAmount: () => false,
    hasCustomFees: () => false,
    hasCoinControl: () => false,
    getFeePresetOptions: jest.fn(() => []),
  },
}));

const onSelectFeeStrategyId = jest.fn();

jest.mock("../../../../hooks/useNetworkFees", () => ({
  useNetworkFees: () => ({
    feesRowLabel: "Network Fees",
    feesRowValue: "--",
    feesRowStrategyLabel: "Medium",
    showNetworkFees: true,
    selectedFeeStrategy: null,
    feeSelector: {
      options: [
        {
          id: "medium",
          kind: "preset",
          label: "Medium",
          sublabel: null,
          selected: true,
          onSelect: () => onSelectFeeStrategyId("medium"),
        },
        {
          id: "custom",
          kind: "custom",
          label: "Custom",
          sublabel: null,
          selected: false,
          onSelect: () => onSelectFeeStrategyId("custom"),
        },
      ],
      selectedId: "medium",
      canOpen: true,
    },
  }),
}));

jest.mock("../useAmountInput", () => ({
  useAmountInput: () => ({
    amountValue: "0",
    amountInputMaxDecimalLength: 8,
    currencyText: "BTC",
    currencyPosition: "right",
    secondaryValue: "$0",
    inputMode: "crypto",
    onAmountChange: jest.fn(),
    onToggleInputMode: jest.fn(),
    cancelPendingUpdates: jest.fn(),
    updateBothInputs: jest.fn(),
  }),
}));

jest.mock("../useQuickActions", () => ({
  useQuickActions: () => [],
}));

jest.mock("../../../Recipient/hooks/useTranslatedBridgeError");

jest.mock("../../../../context/SponsoredSendContext", () => ({
  useSponsoredSend: jest.fn(),
}));

jest.mock("LLD/features/FlowWizard/FlowWizardContext", () => ({
  useFlowWizard: () => ({
    navigation: {
      goToStep: jest.fn(),
      goToNextStep: jest.fn(),
      goToPreviousStep: jest.fn(),
    },
    currentStep: null,
    contextValue: null,
  }),
}));

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedGetMainAccount = jest.mocked(getMainAccount);
const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedUseTranslatedBridgeError = jest.mocked(useTranslatedBridgeError);
const mockedUseSponsoredSend = jest.mocked(useSponsoredSend);

function createNamedError(name: string): Error {
  const err = new Error("");
  err.name = name;
  return err;
}

function isAccount(account: Account | TokenAccount): account is Account {
  return account.type === "Account";
}

describe("useAmountScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedGetAccountBridge.mockReturnValue({
      updateTransaction: (tx: Record<string, unknown>, patch: Record<string, unknown>) => ({
        ...tx,
        ...patch,
      }),
    } as never);

    mockedGetMainAccount.mockImplementation((account: Account | TokenAccount) => {
      if (!isAccount(account)) {
        throw new Error("TokenAccount is not supported by this test helper");
      }
      return account;
    });

    mockedUseTranslatedBridgeError.mockImplementation((error?: Error) =>
      error ? { title: error.name, description: "" } : null,
    );

    mockedUseSponsoredSend.mockReturnValue({
      selectedFeeOptionId: "standard",
      available: false,
      quote: null,
    } as never);
  });

  it("shows an input-blocking recipient error and disables the amount input", () => {
    mockedGetAccountCurrency.mockReturnValue(getCryptoCurrencyById("bitcoin"));

    const account = createMockAccount({
      id: "acc",
      currency: getCryptoCurrencyById("bitcoin"),
    });
    const transaction = {
      family: "bitcoin",
      recipient: "bc1qrecipient",
      amount: new BigNumber(0),
      useAllAmount: false,
    } as Transaction;
    const status = {
      errors: { recipient: createNamedError("SourceHasMultiSign") },
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    } as TransactionStatus;
    const error = status.errors.recipient;

    const { result } = renderHook(
      () =>
        useAmountScreenViewModel({
          account,
          parentAccount: null,
          transaction,
          status,
          bridgePending: false,
          bridgeError: null,
          uiConfig: { hasFeePresets: true } as never,
          transactionActions: { updateTransaction: jest.fn() } as never,
          onSelectCoinControl: jest.fn(),
        }),
      {
        initialState: {
          settings: {
            ...INITIAL_STATE_SETTINGS,
            counterValue: "USD",
          },
        },
      },
    );

    expect(result.current.isInputDisabled).toBe(true);
    expect(result.current.amountMessage).toEqual({
      type: "error",
      text: "SourceHasMultiSign",
      error,
    });
  });

  describe("feeSelector option onSelect", () => {
    function buildBaseParams(currency = getCryptoCurrencyById("bitcoin")) {
      mockedGetAccountCurrency.mockReturnValue(currency);
      const account = createMockAccount({ id: "acc", currency });
      const transaction = {
        family: "bitcoin",
        recipient: "bc1q",
        amount: new BigNumber(0),
        useAllAmount: false,
        feesStrategy: "custom" as const,
        customFeeRate: new BigNumber(10),
        feePerByte: new BigNumber(5),
      } as unknown as Transaction;
      const status = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      } as TransactionStatus;
      const updateTransaction = jest.fn();
      return { account, transaction, status, updateTransaction };
    }

    it("clears custom fee overrides when switching to a preset strategy", () => {
      const { account, transaction, status, updateTransaction } = buildBaseParams();

      const { result } = renderHook(
        () =>
          useAmountScreenViewModel({
            account,
            parentAccount: null,
            transaction,
            status,
            bridgePending: false,
            bridgeError: null,
            uiConfig: { hasFeePresets: true } as never,
            transactionActions: { updateTransaction } as never,
            onSelectCoinControl: jest.fn(),
          }),
        { initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } } },
      );

      const mediumOption = result.current.feeSelector.options.find(o => o.id === "medium");
      mediumOption?.onSelect();

      expect(onSelectFeeStrategyId).toHaveBeenCalledTimes(1);
      expect(onSelectFeeStrategyId).toHaveBeenCalledWith("medium");
    });

    it("does not clear custom fee overrides when selecting the custom strategy", () => {
      const { account, transaction, status, updateTransaction } = buildBaseParams();
      const txWithCustomFees = {
        ...transaction,
        feesStrategy: "medium" as const,
        customFeeRate: new BigNumber(10),
        feePerByte: new BigNumber(5),
      } as unknown as Transaction;

      const { result } = renderHook(
        () =>
          useAmountScreenViewModel({
            account,
            parentAccount: null,
            transaction: txWithCustomFees,
            status,
            bridgePending: false,
            bridgeError: null,
            uiConfig: { hasFeePresets: true } as never,
            transactionActions: { updateTransaction } as never,
            onSelectCoinControl: jest.fn(),
          }),
        { initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } } },
      );

      const customOption = result.current.feeSelector.options.find(o => o.id === "custom");
      customOption?.onSelect();

      expect(onSelectFeeStrategyId).toHaveBeenCalledTimes(1);
      expect(onSelectFeeStrategyId).toHaveBeenCalledWith("custom");
    });
  });

  it("shows a BTC dust/minimum error when review is disabled due to dustLimit", () => {
    mockedGetAccountCurrency.mockReturnValue(getCryptoCurrencyById("bitcoin"));

    const account = createMockAccount({
      id: "acc",
      currency: getCryptoCurrencyById("bitcoin"),
      balance: new BigNumber(10),
    });
    const transaction = {
      family: "bitcoin",
      recipient: "bc1qrecipient",
      amount: new BigNumber(1),
      useAllAmount: false,
    } as Transaction;
    const status = {
      errors: { dustLimit: createNamedError("DustLimit") },
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    } as TransactionStatus;
    const error = status.errors.dustLimit;

    const { result } = renderHook(
      () =>
        useAmountScreenViewModel({
          account,
          parentAccount: null,
          transaction,
          status,
          bridgePending: false,
          bridgeError: null,
          uiConfig: { hasFeePresets: true } as never,
          transactionActions: { updateTransaction: jest.fn() } as never,
          onSelectCoinControl: jest.fn(),
        }),
      {
        initialState: {
          settings: {
            ...INITIAL_STATE_SETTINGS,
            counterValue: "USD",
          },
        },
      },
    );

    expect(result.current.isInputDisabled).toBe(false);
    expect(result.current.amountMessage).toEqual({
      type: "error",
      text: "DustLimit",
      error,
    });
    expect(result.current.reviewDisabled).toBe(true);
  });

  describe("sponsored fee guard", () => {
    function buildAffordableParams(spendableBalance: BigNumber) {
      mockedGetAccountCurrency.mockReturnValue(getCryptoCurrencyById("bitcoin"));
      const account = createMockAccount({
        id: "acc",
        currency: getCryptoCurrencyById("bitcoin"),
        spendableBalance,
      });
      const transaction = {
        family: "bitcoin",
        recipient: "bc1qrecipient",
        amount: new BigNumber(1),
        useAllAmount: false,
      } as Transaction;
      const status = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(1),
        totalSpent: new BigNumber(1),
      } as TransactionStatus;
      return { account, transaction, status };
    }

    function renderViewModel(
      account: Account,
      transaction: Transaction,
      status: TransactionStatus,
    ) {
      return renderHook(
        () =>
          useAmountScreenViewModel({
            account,
            parentAccount: null,
            transaction,
            status,
            bridgePending: false,
            bridgeError: null,
            uiConfig: { hasFeePresets: true } as never,
            transactionActions: { updateTransaction: jest.fn() } as never,
            onSelectCoinControl: jest.fn(),
          }),
        {
          initialState: {
            settings: {
              ...INITIAL_STATE_SETTINGS,
              counterValue: "USD",
            },
          },
        },
      );
    }

    it("disables review and surfaces the translated error when the quote exceeds spendable balance", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(100));

      mockedUseSponsoredSend.mockReturnValue({
        selectedFeeOptionId: "tronify",
        available: true,
        quote: { value: 1_000n, originalValue: 1_500n, savings: 500n },
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.reviewDisabled).toBe(true);
      expect(result.current.sponsoredFeeError).toBe(
        "You don't have enough TRX to cover the Tronify energy rental fee.",
      );
    });

    it("does not force-disable review when the quote is within spendable balance", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        selectedFeeOptionId: "tronify",
        available: true,
        quote: { value: 1_000n, originalValue: 1_500n, savings: 500n },
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFeeError).toBeNull();
      expect(result.current.reviewDisabled).toBe(false);
    });

    it("never disables on its own when the standard fee option is selected", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(100));

      mockedUseSponsoredSend.mockReturnValue({
        selectedFeeOptionId: "standard",
        available: true,
        quote: { value: 1_000n, originalValue: 1_500n, savings: 500n },
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFeeError).toBeNull();
      expect(result.current.reviewDisabled).toBe(false);
    });
  });
});
