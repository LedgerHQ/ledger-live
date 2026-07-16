/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook, waitFor } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import type { Transaction, TransactionStatus } from "../../../../../coin-modules/transaction-types";
import type { SendFlowTransactionActions } from "../../../types";
import { useCustomFeesViewModelCore } from "../useCustomFeesViewModelCore";
import { useBridgeFeeEstimation } from "../useBridgeFeeEstimation";
import { getAccountBridge } from "../../../../../bridge/impl";

const feeAssetInputValueTransform = {
  inputKeys: ["fees"],
  fromCanonicalValue: (value: string) => new BigNumber(value).dividedBy("1e9").toFixed(),
  toCanonicalValue: (value: string) => new BigNumber(value).times("1e9").toFixed(),
};

const customFeeConfig = {
  inputs: [
    {
      key: "fees",
      type: "number" as const,
      unitLabel: "Gwei",
      suggestedRange: {
        getRange: () => ({
          min: "5808247.616531",
          max: "8712371.424796",
        }),
      },
    },
  ],
  getInitialValues: (transaction: unknown) => {
    const fees =
      typeof transaction === "object" && transaction !== null
        ? Reflect.get(transaction, "fees")
        : null;

    return {
      fees: BigNumber.isBigNumber(fees) ? fees.dividedBy("1e9").toFixed() : "",
    };
  },
  buildTransactionPatch: (values: Record<string, string>) => ({
    feesStrategy: "custom",
    fees: new BigNumber(values.fees).times("1e9"),
  }),
};

const usdtCurrencyForAssetOption = {
  id: "celo/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};

jest.mock("../../../../../bridge/descriptor/send/features", () => ({
  resolveFeeUnitLabel: (unitLabel: string | undefined) => unitLabel,
  sendFeatures: {
    getFeeCurrencyAccountId: () => "usdt-account-id",
    getCustomFeeConfig: () => customFeeConfig,
    getCustomAssetsConfig: () => ({
      getOptions: () => [
        { id: "celo", ticker: "CELO", label: "CELO", unitLabel: "Gwei" },
        {
          id: "usdt-account-id",
          ticker: "USDT",
          label: "USDT",
          customFeeInputValueTransform: feeAssetInputValueTransform,
          currency: usdtCurrencyForAssetOption,
          balance: new BigNumber("1234500000"), // 1,234.5 USDT (6 decimals)
        },
      ],
      getSelectedOptionId: () => "usdt-account-id",
      buildPatch: () => null,
    }),
  },
}));
jest.mock("../../../../../bridge/impl");

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const flushBridgeEstimation = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const celoCurrency = {
  id: "celo",
  type: "CryptoCurrency",
  family: "celo",
  name: "Celo",
  ticker: "CELO",
  units: [{ name: "Celo", code: "CELO", magnitude: 18 }],
} as CryptoCurrency;

const usdCurrency = {
  id: "USD",
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
} as Currency;

const usdtToken = {
  id: "celo/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
} as Currency;

function createAccount(): Account {
  return {
    type: "Account",
    id: "celo-account-id",
    name: "Celo",
    currency: celoCurrency,
    balance: new BigNumber("100000000000000000000"),
    spendableBalance: new BigNumber("100000000000000000000"),
    subAccounts: [
      {
        type: "TokenAccount",
        id: "usdt-account-id",
        token: usdtToken,
        balance: new BigNumber("3000000"),
        spendableBalance: new BigNumber("3000000"),
      },
    ],
  } as unknown as Account;
}

function createTransaction(): Transaction {
  return {
    family: "celo",
    amount: new BigNumber(0),
    recipient: "0xRecipient",
    fees: new BigNumber("20160084000000000"),
  } as Transaction;
}

function createStatus(): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
  } as TransactionStatus;
}

function createTransactionActions(): SendFlowTransactionActions {
  return {
    updateTransaction: jest.fn(),
  } as unknown as SendFlowTransactionActions;
}

const labels = {
  getInputLabel: (_inputKey: string, unit: string | undefined) => `Fees amount (${unit})`,
  getHelperLabel: () => null,
  getNetworkFeesInFiatLabel: (currencyTicker: string) => `Network fees in ${currencyTicker}`,
  invalidValue: "Enter a valid number",
  belowMinimum: (min: string) => `Minimum is ${min}`,
  maxFeeBelowPriorityFee: "Max fee must be greater than or equal to max priority fee",
  insufficientBalanceFees: "Insufficient balance for fees",
  confirm: "Confirm",
  suggested: "Suggested",
  payFeesIn: "Pay fees in",
};

describe("useCustomFeesViewModelCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockResolvedValue({
      updateTransaction: jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      })),
      prepareTransaction: jest.fn(async (_account: Account, tx: Transaction) => tx),
      getTransactionStatus: jest.fn(async () => ({
        errors: {},
        estimatedFees: new BigNumber("2006769"),
      })),
    } as never);
  });

  it("should display and submit Celo token fee values in token decimals", async () => {
    const transaction = createTransaction();
    const transactionActions = createTransactionActions();
    const calculateCountervalue = jest.fn((_from: Currency, value: BigNumber) =>
      value.eq("2006769") ? new BigNumber("175") : new BigNumber(0),
    );

    const { result } = renderHook(() =>
      useCustomFeesViewModelCore({
        account: createAccount(),
        parentAccount: null,
        transaction,
        status: createStatus(),
        currency: celoCurrency,
        transactionActions,
        onConfirm: jest.fn(),
        locale: "en",
        discreet: false,
        counterValueCurrency: usdCurrency,
        calculateCountervalue,
        labels,
      }),
    );

    expect(result.current.inputs[0]).toMatchObject({
      label: "Fees amount (USDT)",
      value: "0.020160084",
      suggestedRange: {
        min: "0.005808247616531",
        max: "0.008712371424796",
      },
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    await waitFor(() => {
      expect(calculateCountervalue).toHaveBeenCalledWith(
        expect.objectContaining({ ticker: "USDT" }),
        new BigNumber("2006769"),
      );
    });

    act(() => {
      result.current.onInputChange("fees", "0.03");
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    act(() => {
      result.current.onConfirm();
    });

    const updater = (transactionActions.updateTransaction as jest.Mock).mock.calls[0][0];
    const nextTransaction = updater(transaction);

    expect(nextTransaction.feesStrategy).toBe("custom");
    expect(nextTransaction.fees.toFixed()).toBe("30000000000000000");
  });

  it("derives each asset option's formattedBalance from balance + currency + locale", async () => {
    const transaction = createTransaction();
    const transactionActions = createTransactionActions();
    const calculateCountervalue = jest.fn(() => new BigNumber(0));

    const { result } = renderHook(() =>
      useCustomFeesViewModelCore({
        account: createAccount(),
        parentAccount: null,
        transaction,
        status: createStatus(),
        currency: celoCurrency,
        transactionActions,
        onConfirm: jest.fn(),
        locale: "en",
        discreet: false,
        counterValueCurrency: usdCurrency,
        calculateCountervalue,
        labels,
      }),
    );

    // Native CELO option in the mock has no `balance`/`currency` -> no formattedBalance.
    const celoOption = result.current.assetOptions.find(option => option.id === "celo");
    expect(celoOption?.formattedBalance).toBeUndefined();

    // USDT option carries `balance` (raw BigNumber) + `currency` -> formatted with locale.
    const usdtOption = result.current.assetOptions.find(option => option.id === "usdt-account-id");
    expect(usdtOption?.formattedBalance).toBe("1,234.5");

    const { result: resultFr } = renderHook(() =>
      useCustomFeesViewModelCore({
        account: createAccount(),
        parentAccount: null,
        transaction,
        status: createStatus(),
        currency: celoCurrency,
        transactionActions,
        onConfirm: jest.fn(),
        locale: "fr-FR",
        discreet: false,
        counterValueCurrency: usdCurrency,
        calculateCountervalue,
        labels,
      }),
    );

    const usdtOptionFr = resultFr.current.assetOptions.find(
      option => option.id === "usdt-account-id",
    );
    // Different locale -> different grouping/decimal separators, same underlying value.
    // fr-FR groups with a narrow no-break space (U+202F), not a plain ASCII space.
    expect(usdtOptionFr?.formattedBalance).not.toBe(usdtOption?.formattedBalance);
    expect(usdtOptionFr?.formattedBalance).toBe("1 234,5");
  });

  it("masks asset option balances when discreet mode is on", async () => {
    const transaction = createTransaction();
    const transactionActions = createTransactionActions();
    const calculateCountervalue = jest.fn(() => new BigNumber(0));

    const { result } = renderHook(() =>
      useCustomFeesViewModelCore({
        account: createAccount(),
        parentAccount: null,
        transaction,
        status: createStatus(),
        currency: celoCurrency,
        transactionActions,
        onConfirm: jest.fn(),
        locale: "en",
        discreet: true,
        counterValueCurrency: usdCurrency,
        calculateCountervalue,
        labels,
      }),
    );

    const usdtOption = result.current.assetOptions.find(option => option.id === "usdt-account-id");
    // discreet mode masks the value regardless of the underlying balance/locale.
    expect(usdtOption?.formattedBalance).toBe("***");
  });

  it("should re-estimate bridge fees when the selected fee asset changes", async () => {
    const getTransactionStatus = jest
      .fn()
      .mockResolvedValueOnce({
        errors: {},
        estimatedFees: new BigNumber("2006769"),
      })
      .mockResolvedValueOnce({
        errors: {},
        estimatedFees: new BigNumber("3006769"),
      });
    mockedGetAccountBridge.mockResolvedValue({
      updateTransaction: jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      })),
      prepareTransaction: jest.fn(async (_account: Account, tx: Transaction) => tx),
      getTransactionStatus,
    } as never);

    const account = createAccount();
    const values = { fees: "20160084" };
    const transaction = {
      ...createTransaction(),
      feeCurrencyAccountId: "usdt-account-id",
      feeCurrency: "0xusdt",
      feeCurrencyUnwrapped: "0xusdt",
    } as Transaction;

    const { rerender } = renderHook(
      ({ tx }: { tx: Transaction }) =>
        useBridgeFeeEstimation({
          account,
          parentAccount: null,
          transaction: tx,
          values,
          allInputsValid: true,
          estimatedFeesFromInputs: null,
          customFeeConfig,
        }),
      { initialProps: { tx: transaction } },
    );

    await act(async () => {
      await flushBridgeEstimation();
    });

    await waitFor(() => {
      expect(getTransactionStatus).toHaveBeenCalledTimes(1);
    });

    rerender({
      tx: {
        ...transaction,
        feeCurrencyAccountId: "usdc-account-id",
        feeCurrency: "0xusdc",
        feeCurrencyUnwrapped: "0xusdc",
      } as Transaction,
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    await waitFor(() => {
      expect(getTransactionStatus).toHaveBeenCalledTimes(2);
    });
  });

  it("should ignore previous bridge insufficient balance when local fee estimation is available", async () => {
    mockedGetAccountBridge.mockResolvedValue({
      updateTransaction: jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      })),
      prepareTransaction: jest.fn(async (_account: Account, tx: Transaction) => tx),
      getTransactionStatus: jest.fn(async () => ({
        errors: { insufficientBalanceFees: new Error("Insufficient balance") },
        estimatedFees: new BigNumber("2020160084"),
      })),
    } as never);

    const account = createAccount();
    const values = { fees: "2020160084" };
    const transaction = {
      ...createTransaction(),
      feeCurrencyAccountId: "usdt-account-id",
      feeCurrency: "0xusdt",
      feeCurrencyUnwrapped: "0xusdt",
    } as Transaction;

    const { result, rerender } = renderHook(
      ({
        tx,
        estimatedFeesFromInputs,
      }: {
        tx: Transaction;
        estimatedFeesFromInputs: BigNumber | null;
      }) =>
        useBridgeFeeEstimation({
          account,
          parentAccount: null,
          transaction: tx,
          values,
          allInputsValid: true,
          estimatedFeesFromInputs,
          customFeeConfig,
        }),
      {
        initialProps: {
          tx: transaction,
          estimatedFeesFromInputs: null as BigNumber | null,
        },
      },
    );

    await act(async () => {
      await flushBridgeEstimation();
    });

    await waitFor(() => {
      expect(result.current.bridgeHasInsufficientBalance).toBe(true);
    });

    rerender({
      tx: createTransaction(),
      estimatedFeesFromInputs: new BigNumber("2020160084"),
    });

    expect(result.current.bridgeEstimationKey).toBeNull();
    expect(result.current.estimatedFeesFromBridge).toBeNull();
    expect(result.current.bridgeHasInsufficientBalance).toBe(false);
  });
});
