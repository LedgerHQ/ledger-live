/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import { renderHook } from "@testing-library/react";
import type { Account } from "@ledgerhq/types-live";
import { useAccountsSyncStatus } from "./useAccountsSyncStatus";
import type { BridgeSyncState } from "./types";

const mockSyncState: BridgeSyncState = {};
jest.mock("./context", () => ({
  useBridgeSyncState: () => mockSyncState,
}));

function makeAccount(id: string, ticker: string, lastSyncDate?: Date): Account {
  return {
    id,
    currency: { ticker } as Account["currency"],
    lastSyncDate: lastSyncDate ?? new Date(),
  } as Account;
}

describe("useAccountsSyncStatus", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockSyncState)) {
      delete mockSyncState[key];
    }
  });

  it("returns all accounts up to date when there are no errors and all are up to date", () => {
    const acc1 = makeAccount("a1", "BTC");
    const acc2 = makeAccount("a2", "ETH");
    mockSyncState["a1"] = { pending: false, error: null };
    mockSyncState["a2"] = { pending: false, error: null };

    const { result } = renderHook(() =>
      useAccountsSyncStatus([
        { account: acc1, isUpToDate: true },
        { account: acc2, isUpToDate: true },
      ]),
    );

    expect(result.current.areAllAccountsUpToDate).toBe(true);
    expect(result.current.accountsWithError).toEqual([]);
    expect(result.current.allAccounts).toEqual([acc1, acc2]);
  });

  it("flags accounts with sync errors", () => {
    const acc1 = makeAccount("a1", "BTC");
    const acc2 = makeAccount("a2", "ETH");
    mockSyncState["a1"] = { pending: false, error: new Error("sync failed") };
    mockSyncState["a2"] = { pending: false, error: null };

    const { result } = renderHook(() =>
      useAccountsSyncStatus([
        { account: acc1, isUpToDate: true },
        { account: acc2, isUpToDate: true },
      ]),
    );

    expect(result.current.areAllAccountsUpToDate).toBe(false);
    expect(result.current.accountsWithError).toEqual([acc1]);
  });

  it("flags accounts that are not up to date", () => {
    const acc1 = makeAccount("a1", "BTC");
    mockSyncState["a1"] = { pending: false, error: null };

    const { result } = renderHook(() =>
      useAccountsSyncStatus([{ account: acc1, isUpToDate: false }]),
    );

    expect(result.current.areAllAccountsUpToDate).toBe(false);
    expect(result.current.accountsWithError).toEqual([acc1]);
  });

  it("skips pending accounts when determining errors", () => {
    const acc1 = makeAccount("a1", "BTC");
    mockSyncState["a1"] = { pending: true, error: null };

    const { result } = renderHook(() =>
      useAccountsSyncStatus([{ account: acc1, isUpToDate: false }]),
    );

    expect(result.current.areAllAccountsUpToDate).toBe(true);
    expect(result.current.accountsWithError).toEqual([]);
  });

  it("computes lastSyncMs from all accounts", () => {
    const date1 = new Date("2025-01-01T00:00:00Z");
    const date2 = new Date("2025-06-15T12:00:00Z");
    const acc1 = makeAccount("a1", "BTC", date1);
    const acc2 = makeAccount("a2", "ETH", date2);

    const { result } = renderHook(() =>
      useAccountsSyncStatus([
        { account: acc1, isUpToDate: true },
        { account: acc2, isUpToDate: true },
      ]),
    );

    expect(result.current.lastSyncMs).toBe(date2.getTime());
  });

  it("defaults isUpToDate to true when omitted", () => {
    const acc1 = makeAccount("a1", "BTC");
    mockSyncState["a1"] = { pending: false, error: null };

    const { result } = renderHook(() => useAccountsSyncStatus([{ account: acc1 }]));

    expect(result.current.areAllAccountsUpToDate).toBe(true);
    expect(result.current.accountsWithError).toEqual([]);
  });

  it("returns empty error list when no accounts provided", () => {
    const { result } = renderHook(() => useAccountsSyncStatus([]));

    expect(result.current.areAllAccountsUpToDate).toBe(true);
    expect(result.current.accountsWithError).toEqual([]);
    expect(result.current.allAccounts).toEqual([]);
  });
});
