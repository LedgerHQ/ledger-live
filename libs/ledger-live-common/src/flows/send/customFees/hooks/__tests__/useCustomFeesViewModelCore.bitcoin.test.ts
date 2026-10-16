/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { act, renderHook, waitFor } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Transaction, TransactionStatus } from "../../../../../coin-modules/transaction-types";
import { fees } from "../../../../../families/bitcoin/descriptor/fees";
import { bitcoinPickingStrategy } from "../../../../../families/bitcoin/types";
import type { SendFlowTransactionActions } from "../../../types";
import { useCustomFeesViewModelCore } from "../useCustomFeesViewModelCore";
import { getAccountBridge } from "../../../../../bridge/impl";

// Bitcoin keeps its custom fee rate in `familySpecificData`, next to the other user choices: the
// view model must hand the transaction it patches to the descriptor so they are kept.
jest.mock("../../../../../bridge/descriptor/send/features", () => {
  const actual = jest.requireActual("../../../../../bridge/descriptor/send/features");
  const { fees } = jest.requireActual("../../../../../families/bitcoin/descriptor/fees");
  return {
    ...actual,
    sendFeatures: {
      ...actual.sendFeatures,
      getFeeCurrencyAccountId: () => null,
      getCustomFeeConfig: () => fees.custom,
      getCustomAssetsConfig: () => null,
    },
  };
});
jest.mock("../../../../../bridge/impl");

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const flushBridgeEstimation = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const bitcoin = getCryptoCurrencyById("bitcoin");

const usdCurrency = {
  id: "USD",
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  units: [{ name: "US Dollar", code: "USD", magnitude: 2 }],
} as Currency;

const utxoStrategy = {
  strategy: bitcoinPickingStrategy.CUSTOM,
  excludeUTXOs: [{ hash: "aa", outputIndex: 0 }],
};

function createAccount(): Account {
  return {
    type: "Account",
    id: "bitcoin-account-id",
    name: "Bitcoin",
    currency: bitcoin,
    balance: new BigNumber(100_000_000),
    spendableBalance: new BigNumber(100_000_000),
    subAccounts: [],
  } as unknown as Account;
}

function createTransaction(): Transaction {
  return {
    family: "bitcoin",
    amount: new BigNumber(10_000),
    recipient: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    useAllAmount: false,
    feesStrategy: "medium",
    familySpecificData: { utxoStrategy, opReturnData: "cafe" },
    feeParameters: {
      feePerByte: "4",
      feeRates: { slow: "2", medium: "5", fast: "10" },
      relayFeePerByte: "1",
    },
  } as unknown as Transaction;
}

function createStatus(): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
  } as TransactionStatus;
}

const labels = {
  getInputLabel: (_inputKey: string, unit: string | undefined) => `Fee rate (${unit})`,
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

describe("useCustomFeesViewModelCore (bitcoin fee rate in familySpecificData)", () => {
  let updateTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    updateTransaction = jest.fn((tx: Transaction, patch: Partial<Transaction>) => ({
      ...tx,
      ...patch,
    }));
    mockedGetAccountBridge.mockResolvedValue({
      updateTransaction,
      prepareTransaction: jest.fn(async (_account: Account, tx: Transaction) => tx),
      getTransactionStatus: jest.fn(async () => ({
        errors: {},
        estimatedFees: new BigNumber(1_000),
      })),
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function renderViewModel(transaction: Transaction) {
    const transactionActions = {
      updateTransaction: jest.fn(),
    } as unknown as SendFlowTransactionActions;
    const onConfirm = jest.fn();
    const rendered = renderHook(() =>
      useCustomFeesViewModelCore({
        account: createAccount(),
        parentAccount: null,
        transaction,
        status: createStatus(),
        currency: bitcoin,
        transactionActions,
        onConfirm,
        locale: "en",
        discreet: false,
        counterValueCurrency: usdCurrency,
        calculateCountervalue: () => new BigNumber(0),
        labels,
      }),
    );
    return { ...rendered, transactionActions, onConfirm };
  }

  it("prefills the estimated rate and the presets range", async () => {
    const { result } = renderViewModel(createTransaction());

    await act(async () => {
      await flushBridgeEstimation();
    });

    expect(result.current.inputs).toHaveLength(1);
    expect(result.current.inputs[0]).toMatchObject({
      key: "feePerByte",
      label: "Fee rate (sat/vbyte)",
      value: "4",
      error: null,
      suggestedRange: { min: "2", max: "10" },
    });
  });

  it("estimates the typed rate with the transaction's other user choices kept", async () => {
    const buildTransactionPatch = jest.spyOn(fees.custom!, "buildTransactionPatch");
    const transaction = createTransaction();
    const { result } = renderViewModel(transaction);

    act(() => {
      result.current.onInputChange("feePerByte", "12.7");
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    expect(buildTransactionPatch).toHaveBeenCalledWith({ feePerByte: "12.7" }, transaction);
    await waitFor(() => {
      expect(updateTransaction).toHaveBeenCalledWith(transaction, {
        feesStrategy: "custom",
        familySpecificData: { utxoStrategy, opReturnData: "cafe", feePerByte: "12" },
      });
    });
  });

  it("merges the confirmed rate into the familySpecificData of the transaction being updated", async () => {
    const { result, transactionActions, onConfirm } = renderViewModel(createTransaction());

    act(() => {
      result.current.onInputChange("feePerByte", "8");
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    expect(result.current.isConfirmDisabled).toBe(false);

    act(() => {
      result.current.onConfirm();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    const updater = (transactionActions.updateTransaction as jest.Mock).mock.calls[0][0];

    // The transaction changed since the render (another coin selection): its choices are the kept ones.
    const latestStrategy = { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] };
    const latest = {
      ...createTransaction(),
      familySpecificData: { utxoStrategy: latestStrategy },
    } as unknown as Transaction;
    expect(updater(latest)).toEqual({
      ...latest,
      feesStrategy: "custom",
      familySpecificData: { utxoStrategy: latestStrategy, feePerByte: "8" },
    });

    const maxMode = { ...latest, useAllAmount: true } as Transaction;
    expect(updater(maxMode)).toMatchObject({
      amount: new BigNumber(0),
      familySpecificData: { utxoStrategy: latestStrategy, feePerByte: "8" },
    });
  });

  it("rejects a rate below the relay fee floor", async () => {
    const { result } = renderViewModel(createTransaction());

    act(() => {
      result.current.onInputChange("feePerByte", "0.5");
    });

    await act(async () => {
      await flushBridgeEstimation();
    });

    expect(result.current.inputs[0].error).toBe("Minimum is 1");
    expect(result.current.isConfirmDisabled).toBe(true);
  });
});
