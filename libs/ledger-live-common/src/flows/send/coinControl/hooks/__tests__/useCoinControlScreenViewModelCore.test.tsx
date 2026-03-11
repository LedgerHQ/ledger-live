/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { useCoinControlScreenViewModelCore } from "../useCoinControlScreenViewModelCore";
import type { Transaction, TransactionStatus } from "../../../../../generated/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "../../../../../currencies";
import { bitcoinPickingStrategy } from "../../../../../families/bitcoin/types";

jest.mock("../../../../../bridge/impl");
jest.mock("@ledgerhq/coin-framework/account/helpers", () => ({
  getMainAccount: jest.fn((acc: AccountLike) => acc),
  getAccountCurrency: jest.fn((acc: AccountLike) => (acc as { currency: unknown }).currency),
}));
jest.mock("../../../../../families/bitcoin/react", () => ({
  useBitcoinUtxoDisplayData: () => null,
}));
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
  } as AccountLike;
};

const createTransaction = (): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    utxoStrategy: { strategy: bitcoinPickingStrategy.MERGE_OUTPUTS, excludeUTXOs: [] },
  }) as Transaction;

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

describe("useCoinControlScreenViewModelCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns expected shape with minimal params", () => {
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
        accountUnit: account.currency.units[0],
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
  });

  it("calls onLearnMoreClick when passed", () => {
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
        accountUnit: account.currency.units[0],
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
});
