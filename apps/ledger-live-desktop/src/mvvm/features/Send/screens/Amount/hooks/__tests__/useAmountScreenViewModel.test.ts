/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useAmountScreenViewModel } from "../useAmountScreenViewModel";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/impl";
import { getAccountCurrency, getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import { useTranslatedBridgeError } from "../../../Recipient/hooks/useTranslatedBridgeError";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { createMockAccount } from "../../../Recipient/__integrations__/__fixtures__/accounts";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/coin-framework/account/helpers");
jest.mock("@ledgerhq/live-common/bridge/descriptor", () => ({
  getSendDescriptor: jest.fn(),
  sendFeatures: {
    hasFeePresets: () => false,
    shouldEstimateFeePresetsWithBridge: () => false,
    hasCustomFees: () => false,
    hasCoinControl: () => false,
    getFeePresetOptions: jest.fn(() => []),
  },
}));

const onSelectFeeStrategy = jest.fn();

jest.mock("../../../../hooks/useNetworkFees", () => ({
  useNetworkFees: () => ({
    feesRowLabel: "Network Fees",
    feesRowValue: "--",
    feesRowStrategyLabel: "Medium",
    showNetworkFees: true,
    showFeePresets: false,
    selectedFeeStrategy: null,
    onSelectFeeStrategy,
    feePresetOptions: [],
    fiatByPreset: {},
    legendByPreset: {},
  }),
}));

jest.mock("../useAmountInput", () => ({
  useAmountInput: () => ({
    amountValue: "0",
    amountInputMaxDecimalLength: 8,
    currencyText: "BTC",
    currencyPosition: "right",
    secondaryValue: "$0",
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
  });

  it("shows a blocking Stellar multisign error and disables the amount input", () => {
    mockedGetAccountCurrency.mockReturnValue(getCryptoCurrencyById("stellar"));

    const account = createMockAccount({
      id: "acc",
      currency: getCryptoCurrencyById("stellar"),
    });
    const transaction = {
      family: "stellar",
      recipient: "GRECIPIENT",
      amount: new BigNumber(0),
      useAllAmount: false,
    } as Transaction;
    const status = {
      errors: { recipient: createNamedError("StellarSourceHasMultiSign") },
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    } as TransactionStatus;

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
      text: "StellarSourceHasMultiSign",
    });
  });

  describe("onSelectFeeStrategy", () => {
    function buildBaseParams(currency = getCryptoCurrencyById("bitcoin")) {
      mockedGetAccountCurrency.mockReturnValue(currency);
      const account = createMockAccount({ id: "acc", currency });
      const transaction = {
        family: "bitcoin",
        recipient: "bc1q",
        amount: new BigNumber(0),
        useAllAmount: false,
        feesStrategy: "custom" as const,
        customGasLimit: new BigNumber(21000),
        gasPrice: new BigNumber(100),
        maxFeePerGas: new BigNumber(200),
        maxPriorityFeePerGas: new BigNumber(10),
        customFeeRate: new BigNumber(10),
        feePerByte: new BigNumber(5),
        fees: new BigNumber(1234),
        customFees: { mock: true },
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
          }),
        { initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } } },
      );

      result.current.onSelectFeeStrategy("medium");

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const patched = updater(transaction);

      expect(patched).toMatchObject({
        feesStrategy: "medium",
        customGasLimit: undefined,
        gasPrice: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        feePerByte: undefined,
        customFeeRate: undefined,
        fees: undefined,
        customFees: undefined,
      });
    });

    it("does not clear custom fee overrides when selecting the custom strategy", () => {
      const { account, transaction, status, updateTransaction } = buildBaseParams();
      const txWithCustomFees = {
        ...transaction,
        feesStrategy: "medium" as const,
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
          }),
        { initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } } },
      );

      result.current.onSelectFeeStrategy("custom");

      expect(updateTransaction).toHaveBeenCalledTimes(1);
      const updater = (updateTransaction as jest.Mock).mock.calls[0][0];
      const patched = updater(txWithCustomFees);

      expect(patched).toMatchObject({
        feesStrategy: "custom",
        customGasLimit: new BigNumber(21000),
        gasPrice: new BigNumber(100),
        maxFeePerGas: new BigNumber(200),
        maxPriorityFeePerGas: new BigNumber(10),
        feePerByte: new BigNumber(5),
        customFeeRate: new BigNumber(10),
        fees: new BigNumber(1234),
        customFees: { mock: true },
      });
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
    });
    expect(result.current.reviewDisabled).toBe(true);
  });
});
