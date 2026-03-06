import { renderHook } from "tests/testSetup";
import { useAccountsSyncStatus } from "../useAccountsSyncStatus";
import type { AccountWithUpToDateCheck } from "../useAccountsSyncStatus";
import * as segment from "~/renderer/analytics/segment";

const createAccountWithUpToDateCheck = (
  id: string,
  ticker: string,
  isUpToDate: boolean,
): AccountWithUpToDateCheck => ({
  // Minimal account mock for tests; hook only reads id and currency.ticker
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
  useBatchAccountsSyncState: jest.fn(),
}));

const mockUseBatchAccountsSyncState = jest.requireMock(
  "@ledgerhq/live-common/bridge/react/index",
).useBatchAccountsSyncState;

describe("useAccountsSyncStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not call track when no accounts have problems", () => {
    const trackSpy = jest.spyOn(segment, "track");
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

    renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(trackSpy).not.toHaveBeenCalled();
    trackSpy.mockRestore();
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
    expect(result.current.listOfErrorAccountNames).toBe("");
    expect(result.current.areAllAccountsUpToDate).toBe(true);
  });

  it("returns listOfErrorAccountNames and areAllAccountsUpToDate false when some accounts have sync problems", () => {
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

    expect(result.current.listOfErrorAccountNames).toBe("BTC");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("calls track SyncError once per account with sync error", () => {
    const trackSpy = jest.spyOn(segment, "track");
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

    renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

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

    expect(result.current.listOfErrorAccountNames).toBe("BTC/ETH");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("de-duplicates tickers when multiple accounts of the same currency have sync problems", () => {
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

    expect(result.current.listOfErrorAccountNames).toBe("BTC");
    expect(result.current.areAllAccountsUpToDate).toBe(false);
  });

  it("calls track SyncError twice when two accounts of same currency have sync problems", () => {
    const trackSpy = jest.spyOn(segment, "track");
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

    renderHook(() => useAccountsSyncStatus(accountsWithUpToDateCheck));

    expect(trackSpy).toHaveBeenCalledTimes(2);
    expect(trackSpy).toHaveBeenNthCalledWith(
      1,
      "SyncError",
      expect.objectContaining({ currency: "BTC", page: "/" }),
    );
    expect(trackSpy).toHaveBeenNthCalledWith(
      2,
      "SyncError",
      expect.objectContaining({ currency: "BTC", page: "/" }),
    );
    trackSpy.mockRestore();
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

    expect(result.current.listOfErrorAccountNames).toBe("");
    expect(result.current.areAllAccountsUpToDate).toBe(true);
  });
});
