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
import type { Account, AccountLike, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import {
  TRON_USDT_FEE_ASSET,
  createMockAccount,
  createMockTronUsdtAccount,
} from "../../../Recipient/__integrations__/__fixtures__/accounts";
import { useSendFlowTrackingProperties } from "../../../../hooks/useSendFlowTrackingProperties";
import { useSponsoredSend } from "../../../../context/SponsoredSendContext";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers");
jest.mock("../../../../hooks/useSendFlowTrackingProperties");
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
    getBalanceTypeConfig: jest.fn(),
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

const mockUseQuickActions = jest.fn((_params: { availableBalance: BigNumber }) => []);
jest.mock("../useQuickActions", () => ({
  useQuickActions: (params: { availableBalance: BigNumber }) => mockUseQuickActions(params),
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
const mockedUseSendFlowTrackingProperties = jest.mocked(useSendFlowTrackingProperties);
const mockedUseSponsoredSend = jest.mocked(useSponsoredSend);

const SPONSORED_ID = "sponsored-fixture";
const COVERING_FEE_TOKEN_ACCOUNT = createMockTronUsdtAccount({
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(1_000_000),
});
const SPONSORED_IDENTITY = {
  sponsoredFeeOptionId: SPONSORED_ID,
  providerName: "Provider",
  waivesErrorKeys: ["gasLimit"],
  waivesWarningKeys: ["amount"],
  feeCurrencyTicker: "USDT",
  feeTokenAccount: COVERING_FEE_TOKEN_ACCOUNT,
};
const QUOTE = { feeAsset: TRON_USDT_FEE_ASSET, value: 1_000n, originalValue: 1_500n };

const pendingOut = (value: number): Operation => ({
  id: `pending-out-${value}`,
  hash: `hash-${value}`,
  type: "OUT",
  value: new BigNumber(value),
  fee: new BigNumber(0),
  senders: ["TPayer"],
  recipients: ["TRecipient"],
  blockHeight: null,
  blockHash: null,
  accountId: "mock_tron_usdt_account_id",
  date: new Date(0),
  extra: {},
});

const SPONSORED_FEE_AMOUNTS = {
  sponsored: { value: "$1.06", secondaryValue: "1.06 USDT", originalValue: "$4.44" },
  standard: { value: "$4.44", secondaryValue: "13.44 TRX" },
};

function createNamedError(name: string): Error {
  const err = new Error("");
  err.name = name;
  return err;
}

function isAccount(account: Account | TokenAccount): account is Account {
  return account.type === "Account";
}

function renderViewModel(
  account: AccountLike,
  transaction: Transaction,
  status: TransactionStatus,
  parentAccount: Account | null = null,
) {
  return renderHook(
    () =>
      useAmountScreenViewModel({
        account,
        parentAccount,
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

describe("useAmountScreenViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseSendFlowTrackingProperties.mockReturnValue({
      flow: "send",
      newSendFlow: true,
      blockchain: "bitcoin",
      currency: "BTC",
      currency_id: "bitcoin",
    });
    jest.mocked(sendFeatures.getBalanceTypeConfig).mockReturnValue(null);

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
      ...SPONSORED_IDENTITY,
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

  describe("quick actions base balance", () => {
    function renderWithAccountBalance(transaction: Transaction) {
      const currency = getCryptoCurrencyById("bitcoin");
      mockedGetAccountCurrency.mockReturnValue(currency);
      const account = createMockAccount({
        id: "acc",
        currency,
        balance: new BigNumber(1000),
        spendableBalance: new BigNumber(1000),
      });
      const status = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(0),
        totalSpent: new BigNumber(0),
      } as TransactionStatus;

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
        { initialState: { settings: { ...INITIAL_STATE_SETTINGS, counterValue: "USD" } } },
      );
    }

    it("uses the account balance when the coin holds a single balance", () => {
      renderWithAccountBalance({ family: "bitcoin", recipient: "bc1q" } as Transaction);

      expect(mockUseQuickActions.mock.calls[0][0]).toMatchObject({
        availableBalance: new BigNumber(1000),
      });
    });

    it("uses the selected pool's selectable ceiling, not its unbounded display balance", () => {
      jest.mocked(sendFeatures.getBalanceTypeConfig).mockReturnValue({
        getOptions: () => [
          {
            id: "public",
            translationKey: "balanceType.transparent",
            balance: new BigNumber(300),
            hasPendingBalance: false,
            icon: "check",
          },
          {
            id: "private",
            translationKey: "balanceType.shielded",
            balance: new BigNumber(700),
            hasPendingBalance: false,
            icon: "lock",
          },
        ],
        getSelectedOptionId: () => "private",
        buildSelectionPatch: () => ({}),
        getSelfTransferTarget: () => null,
        buildSelfTransferPatch: () => ({}),
        getSelectableBalance: () => new BigNumber(220),
      });

      renderWithAccountBalance({
        family: "zcash",
        recipient: "u1shielded",
        sender: "private",
      } as unknown as Transaction);

      expect(mockUseQuickActions.mock.calls[0][0]).toMatchObject({
        availableBalance: new BigNumber(220),
      });
    });
  });

  describe("sponsored fee option", () => {
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

    it("disables review and names the fee currency when the fee token can't cover the rent", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        feeTokenAccount: createMockTronUsdtAccount({
          balance: new BigNumber(999),
          spendableBalance: new BigNumber(999),
        }),
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.reviewDisabled).toBe(true);
      expect(result.current.sponsoredFeeError).toBe(
        "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
      );
    });

    it("fails closed when the account holds none of the fee token", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        feeTokenAccount: null,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.reviewDisabled).toBe(true);
      expect(result.current.sponsoredFeeError).not.toBeNull();
    });

    it("does not force-disable review when the quote is within spendable balance", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFeeError).toBeNull();
      expect(result.current.reviewDisabled).toBe(false);
    });

    it("never disables on its own when the standard fee option is selected", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(100));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: "standard",
        available: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFeeError).toBeNull();
      expect(result.current.reviewDisabled).toBe(false);
    });

    function withGasLimitError(spendableBalance: BigNumber) {
      const { account, transaction } = buildAffordableParams(spendableBalance);
      const status = {
        errors: { gasLimit: createNamedError("NotEnoughGas") },
        warnings: {},
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(1),
        totalSpent: new BigNumber(1),
      } as unknown as TransactionStatus;
      return { account, transaction, status };
    }

    it("still surfaces the NotEnoughGas amount message on the standard path", () => {
      const { account, transaction, status } = withGasLimitError(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: "standard",
        available: true,
        quote: null,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.amountMessage).toMatchObject({ type: "error", text: "NotEnoughGas" });
    });

    it("filters the waived NotEnoughGas from the amount message on the sponsored path", () => {
      const { account, transaction, status } = withGasLimitError(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.amountMessage).toBeNull();
    });

    it("keeps NotEnoughGas on the sponsored path when the seam waives no error keys", () => {
      const { account, transaction, status } = withGasLimitError(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        waivesErrorKeys: [],
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.amountMessage).toMatchObject({ type: "error", text: "NotEnoughGas" });
    });

    // coin-tron's status for an energy shortfall: the burn it can't pay, plus the warning.
    function withEnergyShortfall(spendableBalance: BigNumber) {
      const { account, transaction } = buildAffordableParams(spendableBalance);
      const status = {
        errors: { gasLimit: createNamedError("NotEnoughGas") },
        warnings: { amount: createNamedError("TronNotEnoughEnergy") },
        estimatedFees: new BigNumber(0),
        amount: new BigNumber(1),
        totalSpent: new BigNumber(1),
      } as unknown as TransactionStatus;
      return { account, transaction, status };
    }

    it("hides the energy shortfall warning the sponsored fee covers", () => {
      const { account, transaction, status } = withEnergyShortfall(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.amountMessage).toBeNull();
    });

    it("keeps the energy shortfall warning when the seam waives no warning keys", () => {
      const { account, transaction, status } = withEnergyShortfall(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        waivesWarningKeys: [],
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.amountMessage).toMatchObject({
        type: "warning",
        text: "TronNotEnoughEnergy",
      });
    });

    it("keeps Review disabled and loading until the sponsored quote arrives for a built intent", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: null,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.reviewLoading).toBe(true);
      expect(result.current.reviewDisabled).toBe(true);
    });

    it("stops Review loading once the sponsored quote is present", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.reviewLoading).toBe(false);
      expect(result.current.reviewDisabled).toBe(false);
    });

    it("shows the sponsored option's own fee once it is selected", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
        sponsoredFeeAmounts: SPONSORED_FEE_AMOUNTS,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee).toMatchObject(SPONSORED_FEE_AMOUNTS.sponsored);
      expect(result.current.sponsoredNudge.selected).toBe(true);
    });

    it("marks the sponsored fee with the token it is paid in", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
        sponsoredFeeAmounts: SPONSORED_FEE_AMOUNTS,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee?.feeAsset).toEqual({
        ledgerId: COVERING_FEE_TOKEN_ACCOUNT.token.id,
        ticker: COVERING_FEE_TOKEN_ACCOUNT.token.ticker,
      });
    });

    it("shows no fee token icon when the account holds none of the fee token", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        feeTokenAccount: null,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
        sponsoredFeeAmounts: SPONSORED_FEE_AMOUNTS,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee?.feeAsset).toBeNull();
    });

    it("describes the sponsored fee with the provider disclosure instead of the network fees tooltip", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: QUOTE,
        sponsoredFeeAmounts: SPONSORED_FEE_AMOUNTS,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee?.description).toBe(
        "With Provider, a third-party energy provider, fees are paid in USDT.",
      );
    });

    it("shows a pending sponsored fee, not the standard estimate, while the quote reloads", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: SPONSORED_ID,
        available: true,
        intentReady: true,
        quote: null,
        sponsoredFeeAmounts: null,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee).toMatchObject({
        value: "--",
        secondaryValue: null,
        originalValue: null,
      });
    });

    it.each([
      ["the sponsored option is selected", SPONSORED_ID, "Saved with Provider"],
      ["the standard option is selected", "standard", "You could save $1.20 with Provider"],
    ])("labels the fiat savings while %s", (_, selectedFeeOptionId, label) => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId,
        available: true,
        intentReady: true,
        quote: QUOTE,
        savingsFiatFormatted: "$1.20",
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredNudge.label).toBe(label);
    });

    it.each([
      [
        "names the fee asset while the standard option is selected",
        "standard",
        "Pay network fee in USDT",
      ],
      ["shows no label while the sponsored option is selected", SPONSORED_ID, null],
    ])("without fiat savings, %s", (_, selectedFeeOptionId, label) => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId,
        available: true,
        intentReady: true,
        quote: QUOTE,
        savingsFiatFormatted: null,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredNudge.label).toBe(label);
    });

    it("keeps the standard fee row while the standard option is selected", () => {
      const { account, transaction, status } = buildAffordableParams(new BigNumber(1_000_000));

      mockedUseSponsoredSend.mockReturnValue({
        ...SPONSORED_IDENTITY,
        selectedFeeOptionId: "standard",
        available: true,
        quote: QUOTE,
        sponsoredFeeAmounts: SPONSORED_FEE_AMOUNTS,
      } as never);

      const { result } = renderViewModel(account, transaction, status);

      expect(result.current.sponsoredFee).toBeNull();
      expect(result.current.sponsoredNudge.selected).toBe(false);
    });

    describe("when the send spends the fee token", () => {
      beforeEach(() => {
        mockedGetAccountCurrency.mockReturnValue(getCryptoCurrencyById("tron"));
        mockedGetMainAccount.mockImplementation(
          (account: Account | TokenAccount, parentAccount?: Account | null) => {
            if (isAccount(account)) return account;
            if (!parentAccount) throw new Error("A token account needs its parent account");
            return parentAccount;
          },
        );
      });

      function renderTokenSend(amount: number, pendingOperations: Operation[] = []) {
        const feeToken = createMockTronUsdtAccount({
          parentId: "tron_parent",
          balance: new BigNumber(10_000),
          spendableBalance: new BigNumber(10_000),
          pendingOperations,
        });
        const parentAccount = createMockAccount({
          id: "tron_parent",
          currency: getCryptoCurrencyById("tron"),
          subAccounts: [feeToken],
        });
        const transaction = {
          family: "tron",
          recipient: "TRecipient",
          amount: new BigNumber(amount),
          useAllAmount: false,
          subAccountId: feeToken.id,
        } as Transaction;
        const status = {
          errors: {},
          warnings: {},
          estimatedFees: new BigNumber(0),
          amount: new BigNumber(amount),
          totalSpent: new BigNumber(amount),
        } as TransactionStatus;

        mockedUseSponsoredSend.mockReturnValue({
          ...SPONSORED_IDENTITY,
          feeTokenAccount: feeToken,
          selectedFeeOptionId: SPONSORED_ID,
          available: true,
          intentReady: true,
          quote: QUOTE,
        } as never);

        return renderViewModel(feeToken, transaction, status, parentAccount);
      }

      it.each([
        [
          9_001,
          "You don't have enough USDT to cover the amount and the Provider energy rental fee.",
        ],
        [9_000, null],
      ])("with a 1 000 rent on 10 000, an amount of %d shows the error %s", (amount, error) => {
        const { result } = renderTokenSend(amount);

        expect(result.current.sponsoredFeeError).toBe(error);
        expect(result.current.reviewDisabled).toBe(error !== null);
      });

      it("counts an unsynced send of the fee token against its balance", () => {
        const { result } = renderTokenSend(9_000, [pendingOut(500)]);

        expect(result.current.sponsoredFeeError).not.toBeNull();
        expect(result.current.reviewDisabled).toBe(true);
      });
    });
  });
});
