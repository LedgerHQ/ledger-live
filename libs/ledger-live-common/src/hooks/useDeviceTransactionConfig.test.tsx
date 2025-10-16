/**
 * @jest-environment jsdom
 */

import { TextDecoder, TextEncoder } from "util";

// Polyfill for TextDecoder/TextEncoder required by Cardano dependencies
global.TextDecoder = TextDecoder as any;
global.TextEncoder = TextEncoder as any;

// Mock the deviceTransactionConfig module before importing anything else
jest.mock("../transaction/deviceTransactionConfig", () => ({
  getDeviceTransactionConfig: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useDeviceTransactionConfig } from "./useDeviceTransactionConfig";
import { getDeviceTransactionConfig } from "../transaction/deviceTransactionConfig";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "../generated/types";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "../currencies/index";

const mockGetDeviceTransactionConfig = getDeviceTransactionConfig as jest.MockedFunction<
  typeof getDeviceTransactionConfig
>;

const btc = getCryptoCurrencyById("bitcoin");

describe("useDeviceTransactionConfig", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "test-account-id",
    seedIdentifier: "seed-id",
    derivationMode: "" as const,
    index: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/0'/0'/0/0",
    used: true,
    balance: new BigNumber(1000000),
    spendableBalance: new BigNumber(1000000),
    creationDate: new Date(),
    blockHeight: 100,
    currency: btc,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  };

  const mockTransaction: Transaction = {
    family: "bitcoin" as any,
    amount: new BigNumber(100),
    recipient: "test-recipient",
    useAllAmount: false,
  } as Transaction;

  const mockStatus: TransactionStatus = {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(10),
    amount: new BigNumber(100),
    totalSpent: new BigNumber(110),
  } as TransactionStatus;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should load device transaction config fields successfully", async () => {
    const mockFields = [
      { type: "amount", label: "Amount" },
      { type: "fees", label: "Fees" },
    ];

    mockGetDeviceTransactionConfig.mockResolvedValue(mockFields as any);

    const { result } = renderHook(() =>
      useDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: mockTransaction,
        status: mockStatus,
      }),
    );

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.fields).toEqual([]);

    // Wait for async operation
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields).toEqual(mockFields);
    expect(mockGetDeviceTransactionConfig).toHaveBeenCalledWith({
      account: mockAccount,
      parentAccount: null,
      transaction: mockTransaction,
      status: mockStatus,
    });
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    mockGetDeviceTransactionConfig.mockRejectedValue(new Error("Test error"));

    const { result } = renderHook(() =>
      useDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: mockTransaction,
        status: mockStatus,
      }),
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load device transaction config:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it("should reload fields when dependencies change", async () => {
    const mockFields1 = [{ type: "amount", label: "Amount 1" }];
    const mockFields2 = [{ type: "amount", label: "Amount 2" }];

    mockGetDeviceTransactionConfig
      .mockResolvedValueOnce(mockFields1 as any)
      .mockResolvedValueOnce(mockFields2 as any);

    const { result, rerender } = renderHook(
      ({ transaction }) =>
        useDeviceTransactionConfig({
          account: mockAccount,
          parentAccount: null,
          transaction,
          status: mockStatus,
        }),
      {
        initialProps: { transaction: mockTransaction },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields).toEqual(mockFields1);

    // Change transaction
    const newTransaction = {
      ...mockTransaction,
      amount: new BigNumber(200),
    };

    rerender({ transaction: newTransaction });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.fields).toEqual(mockFields2);
    expect(mockGetDeviceTransactionConfig).toHaveBeenCalledTimes(2);
  });

  it("should cleanup on unmount", async () => {
    const mockFields = [{ type: "amount", label: "Amount" }];
    mockGetDeviceTransactionConfig.mockResolvedValue(mockFields as any);

    const { unmount } = renderHook(() =>
      useDeviceTransactionConfig({
        account: mockAccount,
        parentAccount: null,
        transaction: mockTransaction,
        status: mockStatus,
      }),
    );

    unmount();

    // Should not throw any errors
    expect(mockGetDeviceTransactionConfig).toHaveBeenCalled();
  });
});
