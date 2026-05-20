/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "@testing-library/react";
import { useSendFlowAmountReviewCore } from "../useSendFlowAmountReviewCore";
import type { Transaction, TransactionStatus } from "../../../../coin-modules/transaction-types";
import type { AccountLike } from "@ledgerhq/types-live";

const mockCurrency = { ticker: "BTC", type: "CryptoCurrency" as const };

jest.mock("../../../../bridge/impl");
jest.mock("@ledgerhq/ledger-wallet-framework/account/helpers", () => ({
  getMainAccount: jest.fn((acc: AccountLike) => acc),
  getAccountCurrency: jest.fn(() => mockCurrency),
}));

const createAccount = (): AccountLike =>
  ({
    type: "Account",
    id: "bitcoin-account",
    name: "Bitcoin",
    currency: mockCurrency,
    balance: new BigNumber(1000),
    spendableBalance: new BigNumber(900),
    blockHeight: 800000,
    lastSyncDate: new Date(),
  }) as unknown as AccountLike;

const createTransaction = (overrides?: Partial<Transaction>): Transaction =>
  ({
    family: "bitcoin",
    amount: new BigNumber(100),
    recipient: "0xrecipient",
    useAllAmount: false,
    ...overrides,
  }) as unknown as Transaction;

const createStatus = (
  overrides?: Partial<{ errors: Record<string, Error>; estimatedFees: BigNumber }>,
): TransactionStatus =>
  ({
    errors: overrides?.errors ?? {},
    warnings: {},
    estimatedFees: overrides?.estimatedFees ?? new BigNumber(10),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
    txInputs: [],
  }) as TransactionStatus;

const mockLabels = {
  reviewCta: "Review",
  getCtaLabel: (currency: string) => `Get ${currency}`,
};

describe("useSendFlowAmountReviewCore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const getAccountBridge = jest.requireMock("../../../../bridge/impl").getAccountBridge;
    getAccountBridge.mockReturnValue({
      updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({
        ...tx,
        ...patch,
      }),
    });
  });

  it("returns mainAccount and accountCurrency", () => {
    const account = createAccount();
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status: createStatus(),
        bridgePending: false,
        transactionActions: {
          updateTransaction: jest.fn((fn: (tx: Transaction) => Transaction) =>
            fn(createTransaction()),
          ),
        } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.mainAccount).toBe(account);
    expect(result.current.accountCurrency).toBeDefined();
  });

  it("calls updateTransaction when updateTransactionWithPatch is invoked", async () => {
    const account = createAccount();
    const transaction = createTransaction();
    const updateTransaction = jest.fn((fn: (tx: Transaction) => Transaction) => fn(transaction));
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction,
        status: createStatus(),
        bridgePending: false,
        transactionActions: { updateTransaction } as never,
        labels: mockLabels,
      }),
    );

    await result.current.updateTransactionWithPatch({ amount: new BigNumber(200) });
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updater = updateTransaction.mock.calls[0][0];
    const nextTx = updater(transaction);
    expect(nextTx).toMatchObject({ amount: new BigNumber(200) });
  });

  it("computes maxAvailable from spendable minus estimatedFees", () => {
    const account = createAccount();
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status: createStatus({ estimatedFees: new BigNumber(50) }),
        bridgePending: false,
        transactionActions: { updateTransaction: jest.fn() } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.maxAvailable.toNumber()).toBe(850);
  });

  it("sets hasInsufficientFundsError when status has NotEnoughBalance amount error", () => {
    const account = createAccount();
    const status = createStatus();
    (status as { errors?: Record<string, Error> }).errors = {
      amount: { name: "NotEnoughBalance" } as Error,
    };
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status,
        bridgePending: false,
        transactionActions: { updateTransaction: jest.fn() } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.hasInsufficientFundsError).toBe(true);
    expect(result.current.reviewLabel).toBe("Get BTC");
    expect(result.current.reviewShowIcon).toBe(false);
  });

  it("sets reviewLabel to reviewCta when no insufficient funds error", () => {
    const account = createAccount();
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction: createTransaction(),
        status: createStatus(),
        bridgePending: false,
        transactionActions: { updateTransaction: jest.fn() } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.hasInsufficientFundsError).toBe(false);
    expect(result.current.reviewLabel).toBe("Review");
    expect(result.current.reviewShowIcon).toBe(true);
  });

  it("sets reviewDisabled when there are errors and no amount", () => {
    const account = createAccount();
    const status = createStatus();
    (status as { errors?: Record<string, Error> }).errors = {
      recipient: new Error("Invalid"),
    };
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction: createTransaction({ amount: new BigNumber(0), recipient: "" }),
        status,
        bridgePending: false,
        transactionActions: { updateTransaction: jest.fn() } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.hasAmount).toBe(false);
    expect(result.current.reviewDisabled).toBe(true);
  });

  it("sets hasRawAmount and shouldPrepare from transaction", () => {
    const account = createAccount();
    const transaction = createTransaction({
      amount: new BigNumber(50),
      recipient: "0xrec",
    });
    const { result } = renderHook(() =>
      useSendFlowAmountReviewCore({
        account,
        parentAccount: null,
        transaction,
        status: createStatus(),
        bridgePending: true,
        transactionActions: { updateTransaction: jest.fn() } as never,
        labels: mockLabels,
      }),
    );

    expect(result.current.hasRawAmount).toBe(true);
    expect(result.current.shouldPrepare).toBe(true);
    expect(result.current.amountComputationPending).toBe(true);
  });
});
