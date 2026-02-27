/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import {
  createTriggerSync,
  getAggregateSyncState,
  useAccountsSyncStatus,
  type AccountWithUpToDateCheck,
} from "../useAccountsSyncStatus";

const createAccountWithUpToDateCheck = (
  id: string,
  ticker: string,
  isUpToDate: boolean,
): AccountWithUpToDateCheck => ({
  account: {
    id,
    type: "Account" as const,
    currency: { ticker },
    lastSyncDate: new Date(),
  } as AccountWithUpToDateCheck["account"],
  isUpToDate,
});

jest.mock("../useAccountSyncState", () => ({
  useBatchAccountsSyncState: jest.fn(),
}));

const mockUseBatchAccountsSyncState =
  jest.requireMock("../useAccountSyncState").useBatchAccountsSyncState;

describe("useAccountsSyncStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty list and areAllAccountsUpToDate true when no accounts have problems", () => {
    const accountsWithUpToDateCheck = [
      createAccountWithUpToDateCheck("a1", "BTC", true),
      createAccountWithUpToDateCheck("a2", "ETH", true),
    ];
    mockUseBatchAccountsSyncState.mockReturnValue([
      {
        syncState: { pending: false, error: null },
        account: accountsWithUpToDateCheck[0].account,
      },
      {
        syncState: { pending: false, error: null },
        account: accountsWithUpToDateCheck[1].account,
      },
    ]);

    const { result } = renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(result.current.allAccounts).toHaveLength(2);
    expect(result.current.accountsWithError).toHaveLength(0);
    expect(result.current.areAllAccountsUpToDate).toBe(true);
    expect(typeof result.current.lastSyncMs).toBe("number");
    expect(result.current.lastSyncMs).toBeGreaterThanOrEqual(0);
  });

  it("returns accountsWithError and areAllAccountsUpToDate false when some accounts have sync problems", () => {
    const accountsWithUpToDateCheck = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "ETH", true),
    ];
    mockUseBatchAccountsSyncState.mockReturnValue([
      {
        syncState: { pending: false, error: new Error("sync failed") },
        account: accountsWithUpToDateCheck[0].account,
      },
      {
        syncState: { pending: false, error: null },
        account: accountsWithUpToDateCheck[1].account,
      },
    ]);

    const { result } = renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(result.current.accountsWithError).toHaveLength(1);
    expect(result.current.accountsWithError[0].id).toBe("a1");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("returns all accounts with error when multiple have sync problems", () => {
    const accountsWithUpToDateCheck = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "ETH", false),
    ];
    mockUseBatchAccountsSyncState.mockReturnValue([
      {
        syncState: { pending: false, error: new Error() },
        account: accountsWithUpToDateCheck[0].account,
      },
      {
        syncState: { pending: false, error: new Error() },
        account: accountsWithUpToDateCheck[1].account,
      },
    ]);

    const { result } = renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(result.current.accountsWithError).toHaveLength(2);
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("returns all out-of-sync accounts when multiple of same currency have sync problems", () => {
    const accountsWithUpToDateCheck = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "BTC", false),
    ];
    mockUseBatchAccountsSyncState.mockReturnValue([
      {
        syncState: { pending: false, error: new Error() },
        account: accountsWithUpToDateCheck[0].account,
      },
      {
        syncState: { pending: false, error: new Error() },
        account: accountsWithUpToDateCheck[1].account,
      },
    ]);

    const { result } = renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(result.current.accountsWithError).toHaveLength(2);
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("excludes accounts that are pending from sync problem list", () => {
    const accountsWithUpToDateCheck = [createAccountWithUpToDateCheck("a1", "BTC", false)];
    mockUseBatchAccountsSyncState.mockReturnValue([
      {
        syncState: { pending: true, error: null },
        account: accountsWithUpToDateCheck[0].account,
      },
    ]);

    const { result } = renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(result.current.accountsWithError).toHaveLength(0);
    expect(result.current.areAllAccountsUpToDate).toBe(true);
  });
});

describe("getAggregateSyncState", () => {
  it("returns isError true when accounts are not all up to date", () => {
    const { isPending, isError } = getAggregateSyncState({
      areAllAccountsUpToDate: false,
      bridgeOrCvPending: false,
      bridgeOrCvError: false,
      walletSyncPending: false,
      walletSyncError: false,
    });
    expect(isPending).toBe(false);
    expect(isError).toBe(true);
  });

  it("returns isPending true when bridge or wallet is pending", () => {
    const { isPending } = getAggregateSyncState({
      areAllAccountsUpToDate: true,
      bridgeOrCvPending: true,
      bridgeOrCvError: false,
      walletSyncPending: false,
      walletSyncError: false,
    });
    expect(isPending).toBe(true);
  });

  it("returns isError true when walletSyncError is true", () => {
    const { isError } = getAggregateSyncState({
      areAllAccountsUpToDate: true,
      bridgeOrCvPending: false,
      bridgeOrCvError: false,
      walletSyncPending: false,
      walletSyncError: true,
    });
    expect(isError).toBe(true);
  });
});

describe("createTriggerSync", () => {
  it("calls onUserRefresh, poll, and bridgeSync with SYNC_ALL_ACCOUNTS", () => {
    const onUserRefresh = jest.fn();
    const poll = jest.fn();
    const bridgeSync = jest.fn();
    const trigger = createTriggerSync({
      onUserRefresh,
      poll,
      bridgeSync,
      reason: "user-click",
    });
    trigger();
    expect(onUserRefresh).toHaveBeenCalledTimes(1);
    expect(poll).toHaveBeenCalledTimes(1);
    expect(bridgeSync).toHaveBeenCalledWith({
      type: "SYNC_ALL_ACCOUNTS",
      priority: 5,
      reason: "user-click",
    });
  });
});
