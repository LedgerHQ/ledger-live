import { renderHook } from "tests/testSetup";
import { useAccountsSyncStatus } from "../useAccountsSyncStatus";
import type { AccountWithUpToDateCheck } from "../useAccountsSyncStatus";
import * as segment from "~/renderer/analytics/segment";

const createAccountWithUpToDateCheck = (
  id: string,
  ticker: string,
  isUpToDate: boolean,
): AccountWithUpToDateCheck => ({
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  account: {
    id,
    type: "Account" as const,
    currency: { ticker },
    lastSyncDate: new Date(),
  } as AccountWithUpToDateCheck["account"],
  isUpToDate,
});

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useAccountsSyncStatus: jest.fn(),
}));

const mockUseAccountsSyncStatusCommon = jest.requireMock("@ledgerhq/live-common/bridge/react/index")
  .useAccountsSyncStatus as jest.Mock;

describe("useAccountsSyncStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not call track when no accounts have problems", () => {
    const trackSpy = jest.spyOn(segment, "track");
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", true),
      createAccountWithUpToDateCheck("a2", "ETH", true),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: [],
      areAllAccountsUpToDate: true,
      lastSyncMs: Date.now(),
    });

    renderHook(() => useAccountsSyncStatus(accounts));

    expect(trackSpy).not.toHaveBeenCalled();
    trackSpy.mockRestore();
  });

  it("returns empty list and areAllAccountsUpToDate true when no accounts have problems", () => {
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", true),
      createAccountWithUpToDateCheck("a2", "ETH", true),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: [],
      areAllAccountsUpToDate: true,
      lastSyncMs: Date.now(),
    });

    const { result } = renderHook(() => useAccountsSyncStatus(accounts));

    expect(result.current.allAccounts).toHaveLength(2);
    expect(result.current.listOfErrorAccountNames).toBe("");
    expect(result.current.areAllAccountsUpToDate).toBe(true);
  });

  it("returns listOfErrorAccountNames and areAllAccountsUpToDate false when some accounts have sync problems", () => {
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "ETH", true),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: [accounts[0].account],
      areAllAccountsUpToDate: false,
      lastSyncMs: Date.now(),
    });

    const { result } = renderHook(() => useAccountsSyncStatus(accounts));

    expect(result.current.listOfErrorAccountNames).toBe("BTC");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("calls track SyncError once per unique ticker with sync error", () => {
    const trackSpy = jest.spyOn(segment, "track");
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "ETH", false),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: accounts.map(a => a.account),
      areAllAccountsUpToDate: false,
      lastSyncMs: Date.now(),
    });

    renderHook(() => useAccountsSyncStatus(accounts));

    expect(trackSpy).toHaveBeenCalledTimes(2);
    expect(trackSpy).toHaveBeenCalledWith(
      "SyncError",
      expect.objectContaining({ currency: "BTC", page: "/" }),
    );
    expect(trackSpy).toHaveBeenCalledWith(
      "SyncError",
      expect.objectContaining({ currency: "ETH", page: "/" }),
    );
    trackSpy.mockRestore();
  });

  it("joins multiple error account tickers with /", () => {
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "ETH", false),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: accounts.map(a => a.account),
      areAllAccountsUpToDate: false,
      lastSyncMs: Date.now(),
    });

    const { result } = renderHook(() => useAccountsSyncStatus(accounts));

    expect(result.current.listOfErrorAccountNames).toBe("BTC/ETH");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("de-duplicates tickers when multiple accounts of the same currency have sync problems", () => {
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "BTC", false),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: accounts.map(a => a.account),
      areAllAccountsUpToDate: false,
      lastSyncMs: Date.now(),
    });

    const { result } = renderHook(() => useAccountsSyncStatus(accounts));

    expect(result.current.listOfErrorAccountNames).toBe("BTC");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("calls track SyncError once per account even when they share the same currency", () => {
    const trackSpy = jest.spyOn(segment, "track");
    const accounts = [
      createAccountWithUpToDateCheck("a1", "BTC", false),
      createAccountWithUpToDateCheck("a2", "BTC", false),
    ];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: accounts.map(a => a.account),
      areAllAccountsUpToDate: false,
      lastSyncMs: Date.now(),
    });

    renderHook(() => useAccountsSyncStatus(accounts));

    expect(trackSpy).toHaveBeenCalledTimes(2);
    expect(trackSpy).toHaveBeenCalledWith(
      "SyncError",
      expect.objectContaining({ currency: "BTC", page: "/" }),
    );
    trackSpy.mockRestore();
  });

  it("excludes accounts that are pending from sync problem list", () => {
    const accounts = [createAccountWithUpToDateCheck("a1", "BTC", false)];
    mockUseAccountsSyncStatusCommon.mockReturnValue({
      allAccounts: accounts.map(a => a.account),
      accountsWithError: [],
      areAllAccountsUpToDate: true,
      lastSyncMs: Date.now(),
    });

    const { result } = renderHook(() => useAccountsSyncStatus(accounts));

    expect(result.current.listOfErrorAccountNames).toBe("");
    expect(result.current.areAllAccountsUpToDate).toBe(true);
  });
});
