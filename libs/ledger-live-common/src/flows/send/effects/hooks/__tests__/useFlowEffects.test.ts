/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import type { AccountLike } from "@ledgerhq/types-live";
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
const currency = { id: "ethereum", family: "evm" } as CryptoOrTokenCurrency;
const baseTransaction = { family: "evm", amount: "0" } as unknown as Transaction;

const updateTransaction = jest.fn((updater: (tx: Transaction) => Transaction) => {
  updater(baseTransaction);
});

const mockBridge = {
  updateTransaction: jest.fn((tx, patch) => ({ ...tx, ...patch })),
};

function renderRunner(params?: Partial<Parameters<typeof useFlowEffects>[0]>) {
  return renderHook(() =>
    useFlowEffects({
      account,
      parentAccount: null,
      transaction: baseTransaction,
      currency,
      updateTransaction,
      ...params,
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
});
