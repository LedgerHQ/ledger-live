/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Transaction } from "../../../../../coin-modules/transaction-types";
import type { FlowEffect } from "../../../../../bridge/descriptor/types";
import { sendFeatures } from "../../../../../bridge/descriptor/send/features";
import { getAccountBridge } from "../../../../../bridge/impl";
import { useFlowEffects } from "../useFlowEffects";

jest.mock("../../../../../bridge/impl");
jest.mock("../../../../../bridge/descriptor/send/features");

const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedGetAmountEffects = jest.mocked(sendFeatures.getAmountEffects);

const account = { id: "account_id" } as AccountLike;
const parentAccount = { id: "parent_account_id" } as Account;
const currency = { id: "ethereum", family: "evm" } as CryptoOrTokenCurrency;
const baseTransaction = { family: "evm", amount: "0" } as unknown as Transaction;

const updateTransaction = jest.fn((updater: (tx: Transaction) => Transaction) => {
  updater(baseTransaction);
});

const mockBridge = {
  updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
};

function renderRunner(params?: Partial<Parameters<typeof useFlowEffects>[0]>) {
  return renderHook((rerenderParams?: Partial<Parameters<typeof useFlowEffects>[0]>) =>
    useFlowEffects({
      account,
      parentAccount: null,
      transaction: baseTransaction,
      currency,
      updateTransaction,
      ...params,
      ...rerenderParams,
    }),
  );
}

describe("useFlowEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAccountBridge.mockResolvedValue(mockBridge as never);
    mockedGetAmountEffects.mockReturnValue([]);
  });

  it("is inert when the descriptor declares no effect", async () => {
    const { result } = renderRunner();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it("runs effects and applies the returned patch via the bridge", async () => {
    const run = jest.fn(async () => ({ gasOptions: { medium: {} } }));
    mockedGetAmountEffects.mockReturnValue([{ id: "syncGasOptions", run } as FlowEffect]);

    const { result } = renderRunner();

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({ account, transaction: baseTransaction, bridge: mockBridge }),
    );
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(mockBridge.updateTransaction).toHaveBeenCalledWith(baseTransaction, {
      gasOptions: { medium: {} },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it("does not apply a patch when an effect resolves with null", async () => {
    const run = jest.fn(async () => null);
    mockedGetAmountEffects.mockReturnValue([{ id: "noop", run } as FlowEffect]);

    const { result } = renderRunner();

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    expect(updateTransaction).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("captures the error when an effect throws", async () => {
    const failure = new Error("effect failed");
    const run = jest.fn(async () => {
      throw failure;
    });
    mockedGetAmountEffects.mockReturnValue([{ id: "boom", run } as FlowEffect]);

    const { result } = renderRunner();

    await waitFor(() => expect(result.current.error).toBe(failure));
    expect(updateTransaction).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("clears loading and error when becoming inert", async () => {
    let resolveEffect: (value: null) => void = () => {};
    const effectPromise = new Promise<null>(resolve => {
      resolveEffect = resolve;
    });
    const run = jest.fn(() => effectPromise);
    mockedGetAmountEffects.mockReturnValue([{ id: "slow", run } as FlowEffect]);

    const { result, rerender } = renderRunner();

    await waitFor(() => expect(result.current.loading).toBe(true));

    rerender({ account: null });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveEffect(null);
      await effectPromise;
    });
  });

  it("reruns effects when the account context changes with an equal transaction", async () => {
    const run = jest.fn(async () => null);
    const nextAccount = { id: "next_account_id" } as AccountLike;
    const equalTransaction = { ...baseTransaction } as Transaction;
    mockedGetAmountEffects.mockReturnValue([{ id: "syncGasOptions", run } as FlowEffect]);

    const { rerender } = renderRunner();

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    rerender({ account: nextAccount, parentAccount, transaction: equalTransaction });

    await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
    expect(run).toHaveBeenLastCalledWith(
      expect.objectContaining({
        account: nextAccount,
        parentAccount,
        transaction: equalTransaction,
      }),
    );
  });

  it("runs effects when the effect set changes with an equal transaction", async () => {
    const firstRun = jest.fn(async () => null);
    const nextRun = jest.fn(async () => null);
    const nextCurrency = { id: "ethereum", family: "evm" } as CryptoOrTokenCurrency;
    const equalTransaction = { ...baseTransaction } as Transaction;
    mockedGetAmountEffects.mockReturnValue([{ id: "first", run: firstRun } as FlowEffect]);

    const { rerender } = renderRunner();

    await waitFor(() => expect(firstRun).toHaveBeenCalledTimes(1));

    mockedGetAmountEffects.mockReturnValue([{ id: "next", run: nextRun } as FlowEffect]);
    rerender({ currency: nextCurrency, transaction: equalTransaction });

    await waitFor(() => expect(nextRun).toHaveBeenCalledTimes(1));
  });

  it("commits all patches in a single updateTransaction call", async () => {
    const firstRun = jest.fn(async () => ({ gasOptions: { medium: {} } }));
    const secondRun = jest.fn(async () => ({ feesStrategy: "medium" }));
    mockedGetAmountEffects.mockReturnValue([
      { id: "syncGasOptions", run: firstRun } as FlowEffect,
      { id: "setFeesStrategy", run: secondRun } as FlowEffect,
    ]);

    renderRunner();

    await waitFor(() => expect(secondRun).toHaveBeenCalledTimes(1));
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(mockBridge.updateTransaction).toHaveBeenCalledTimes(4);
    expect(mockBridge.updateTransaction).toHaveBeenNthCalledWith(1, baseTransaction, {
      gasOptions: { medium: {} },
    });
    expect(mockBridge.updateTransaction).toHaveBeenNthCalledWith(
      2,
      { ...baseTransaction, gasOptions: { medium: {} } },
      { feesStrategy: "medium" },
    );
    expect(mockBridge.updateTransaction).toHaveBeenNthCalledWith(3, baseTransaction, {
      gasOptions: { medium: {} },
    });
    expect(mockBridge.updateTransaction).toHaveBeenNthCalledWith(
      4,
      { ...baseTransaction, gasOptions: { medium: {} } },
      { feesStrategy: "medium" },
    );
  });

  it("passes staged transaction patches to later effects", async () => {
    const firstRun = jest.fn(async () => ({ gasOptions: { medium: {} } }));
    const secondRun = jest.fn(async () => null);
    mockedGetAmountEffects.mockReturnValue([
      { id: "syncGasOptions", run: firstRun } as FlowEffect,
      { id: "noop", run: secondRun } as FlowEffect,
    ]);

    renderRunner();

    await waitFor(() => expect(secondRun).toHaveBeenCalledTimes(1));
    expect(secondRun).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction: { ...baseTransaction, gasOptions: { medium: {} } },
      }),
    );
  });

  it("does not rerun effects after its own patch is applied", async () => {
    const run = jest.fn(async () => ({ gasOptions: { medium: {} } }));
    mockedGetAmountEffects.mockReturnValue([{ id: "syncGasOptions", run } as FlowEffect]);

    const patchedTransaction = { ...baseTransaction, gasOptions: { medium: {} } } as Transaction;
    const updateTransactionWithPatch = jest.fn((updater: (tx: Transaction) => Transaction) => {
      updater(baseTransaction);
    });

    const { rerender } = renderHook(
      ({ transaction }) =>
        useFlowEffects({
          account,
          parentAccount: null,
          transaction,
          currency,
          updateTransaction: updateTransactionWithPatch,
        }),
      { initialProps: { transaction: baseTransaction } },
    );

    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    rerender({ transaction: patchedTransaction });

    await waitFor(() => expect(updateTransactionWithPatch).toHaveBeenCalledTimes(1));
    expect(run).toHaveBeenCalledTimes(1);
  });
});
