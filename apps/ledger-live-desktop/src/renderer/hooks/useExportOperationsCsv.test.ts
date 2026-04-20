/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "tests/testSetup";
import { ipcRenderer } from "electron";
import { BigNumber } from "bignumber.js";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { TokenAccount } from "@ledgerhq/types-live";
import { useExportOperationsCsv } from "./useExportOperationsCsv";
import { BridgeSyncState } from "node_modules/@ledgerhq/live-common/src/bridge/react/types";

const mockSync = jest.fn();
const mockSyncState = jest.fn();
const mockAccountsOpToCSV = jest.fn().mockReturnValue("csv-data");

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  useBridgeSync: () => mockSync,
  useBridgeSyncState: () => mockSyncState(),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  CountervaluesProvider: ({ children }: { children: React.ReactNode }) => children,
  useCountervaluesState: () => ({}),
  useCountervaluesPolling: () => ({}),
}));

jest.mock("@ledgerhq/live-common/csvExport", () => ({
  accountsOpToCSV: (...args: unknown[]) => mockAccountsOpToCSV(...args),
}));

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const mockedIpcInvoke = jest.mocked(ipcRenderer.invoke);

const mockEthCurrency: CryptoCurrency = {
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  type: "CryptoCurrency",
  managerAppName: "Ethereum",
  coinType: 60,
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "ethereum",
  explorerViews: [],
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
};

const mockToken: TokenCurrency = {
  id: "ethereum/erc20/usdt",
  type: "TokenCurrency",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  parentCurrency: mockEthCurrency,
  tokenType: "erc20",
  units: [{ name: "USDT", code: "USDT", magnitude: 6 }],
};

function makeTokenAccount(parentId: string, operationsCount: number): TokenAccount {
  return {
    type: "TokenAccount",
    id: `${parentId}|sub-0`,
    parentId,
    token: mockToken,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    operationsCount,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
  };
}

function makeAccount(id: string, opsCount: number) {
  const account = genAccount(id);
  account.operationsCount = opsCount;
  account.operations = account.operations.slice(0, opsCount);
  return account;
}

function setupHook(
  overrides: {
    accounts?: ReturnType<typeof makeAccount>[];
    checkedIds?: string[];
    onSuccess?: jest.Mock;
    onError?: jest.Mock;
  } = {},
) {
  const account = overrides.accounts?.[0] ?? makeAccount("1", 0);
  const accounts = overrides.accounts ?? [account];
  return renderHook(() =>
    useExportOperationsCsv({
      accounts,
      checkedIds: overrides.checkedIds ?? [account.id],
      onSuccess: overrides.onSuccess,
      onError: overrides.onError,
    }),
  );
}

function mockSaveDialogThenExport(fileSaved: boolean) {
  mockedIpcInvoke
    .mockResolvedValueOnce({ filePath: "/path/to/file.csv" })
    .mockResolvedValueOnce(fileSaved);
}

describe("useExportOperationsCsv", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncState.mockReturnValue({});
  });

  it("should return initial state", () => {
    const { result } = setupHook({ checkedIds: [] });
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("should schedule a sync when accounts are provided", () => {
    setupHook({ checkedIds: [] });
    expect(mockSync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "SYNC_SOME_ACCOUNTS",
        priority: 10,
        reason: "export-operations",
      }),
    );
  });

  it("should not schedule a sync when accounts list is empty", () => {
    setupHook({ accounts: [], checkedIds: [] });
    expect(mockSync).not.toHaveBeenCalled();
  });

  it("should not schedule sync more than once", () => {
    const { rerender } = setupHook({ checkedIds: [] });
    rerender();
    rerender();
    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  it("should not set isLoading when selected accounts have all operations", () => {
    const account = makeAccount("1", 5);
    account.operationsCount = account.operations.length;
    const { result } = setupHook({ accounts: [account] });
    expect(result.current.isLoading).toBe(false);
  });

  it("should set isLoading when selected account is syncing", () => {
    const account = makeAccount("1", 0);
    const { rerender, result } = setupHook({ accounts: [account], checkedIds: [account.id] });

    const syncState: BridgeSyncState = {};
    syncState[account.id] = { pending: true, error: null };
    mockSyncState.mockReturnValueOnce(syncState);

    rerender();
    expect(result.current.isLoading).toBe(true);

    mockSyncState.mockReturnValueOnce({});

    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it("should set isLoading when selected account sub accounts is syncing", () => {
    const account = makeAccount("1", 0);
    account.subAccounts = [makeTokenAccount(account.id, 0)];

    const { rerender, result } = setupHook({ accounts: [account], checkedIds: [account.id] });

    const syncState: BridgeSyncState = {};
    syncState[account.subAccounts[0].id] = { pending: true, error: null };
    mockSyncState.mockReturnValueOnce(syncState);

    rerender();
    expect(result.current.isLoading).toBe(true);

    mockSyncState.mockReturnValueOnce({});

    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it("should not set isLoading when selected account is not syncing (another account is syncing)", () => {
    const account = makeAccount("1", 0);
    const account2 = makeAccount("2", 0);
    account2.subAccounts = [makeTokenAccount(account2.id, 0)];

    const { rerender, result } = setupHook({
      accounts: [account, account2],
      checkedIds: [account.id],
    });

    const syncState: BridgeSyncState = {};
    syncState[account2.id] = { pending: true, error: null };
    mockSyncState.mockReturnValueOnce(syncState);

    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it("should not set isLoading when selected account is not syncing (another account sub account is syncing)", () => {
    const account = makeAccount("1", 0);
    const account2 = makeAccount("2", 0);
    account2.subAccounts = [makeTokenAccount(account2.id, 0)];

    const { rerender, result } = setupHook({
      accounts: [account, account2],
      checkedIds: [account.id],
    });

    const syncState: BridgeSyncState = {};
    syncState[account2.subAccounts[0].id] = { pending: true, error: null };
    mockSyncState.mockReturnValueOnce(syncState);

    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it("should export CSV successfully and call onSuccess", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    mockSaveDialogThenExport(true);

    const { result } = setupHook({ onSuccess, onError });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect(mockAccountsOpToCSV).toHaveBeenCalled();
  });

  it("should set error when file save fails", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    mockSaveDialogThenExport(false);

    const { result } = setupHook({ onSuccess, onError });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("should do nothing when save dialog is cancelled", async () => {
    const onSuccess = jest.fn();
    const onError = jest.fn();
    mockedIpcInvoke.mockResolvedValueOnce({ canceled: true, filePath: "" });

    const { result } = setupHook({ onSuccess, onError });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("should set error when show-save-dialog rejects", async () => {
    const onError = jest.fn();
    mockedIpcInvoke.mockRejectedValueOnce(new Error("IPC failure"));

    const { result } = setupHook({ onError });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(result.current.error).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("should set error when export-operations IPC rejects", async () => {
    const onError = jest.fn();
    mockedIpcInvoke
      .mockResolvedValueOnce({ filePath: "/path/to/file.csv" })
      .mockRejectedValueOnce(new Error("write failed"));

    const { result } = setupHook({ onError });

    await act(async () => {
      await result.current.exportCsv();
    });

    expect(result.current.error).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("should reset success, error and sync flag via resetState", async () => {
    mockSaveDialogThenExport(true);
    const { result } = setupHook();

    await act(async () => {
      await result.current.exportCsv();
    });
    expect(result.current.success).toBe(true);

    act(() => {
      result.current.resetState();
    });

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(false);
  });
});
