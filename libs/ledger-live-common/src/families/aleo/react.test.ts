/**
 * @jest-environment jsdom
 */
import "../../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Subject } from "rxjs";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Transaction } from "../../generated/types";
import type { AleoAccount, AleoUnspentRecord } from "./types";
import { aleoPrivateSyncProgress$ } from "./privateSyncProgress";
import { MANDATORY_SYNC_POLLING_DELAY, PROGRESS_THROTTLE_INTERVAL_MS } from "./constants";
import {
  useAleoViewKeyApproval,
  buildAccountsWithViewKeys,
  useAleoPrivateSync,
  useAleoQuickAmountSelector,
} from "./react";
import { ALEO_ACCOUNT_1, makeAleoAccount } from "./__mocks__/account.mock";

const mockCreateAction = jest.fn();
const mockUseHook = jest.fn();
const mockMapResult = jest.fn();
const mockConnectApp = jest.fn();

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(() => ({ enabled: false })),
}));

jest.mock("./hw/getViewKey/index", () => ({
  createAction: (...args: unknown[]) => mockCreateAction(...args),
  getViewKeyExec: jest.fn(),
}));

jest.mock("../../hw/connectApp", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockConnectApp(...args),
}));

jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  patchAccountWithViewKey: jest.fn((account: Account, viewKey: string) => ({
    ...account,
    id: `${account.id}:patched:${viewKey}`,
  })),
}));

const { useFeature } = jest.requireMock("@features/platform-feature-flags");
const { getViewKeyExec } = jest.requireMock("./hw/getViewKey/index");

const mockDevice = { deviceId: "test-device" } as never;
const mockCurrency = { id: "aleo", type: "CryptoCurrency" } as CryptoCurrency;
const mockAccount1 = { id: "acc1", freshAddress: "addr1" } as Account;
const mockAccount2 = { id: "acc2", freshAddress: "addr2" } as Account;

const mockHookState = {
  sharePending: false,
  shareProgress: { completed: 0, total: 0, viewKeys: {} },
};

describe("useAleoViewKeyApproval", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHook.mockReturnValue(mockHookState);
    mockMapResult.mockReturnValue(null);
    mockCreateAction.mockReturnValue({
      useHook: mockUseHook,
      mapResult: mockMapResult,
    });
  });

  it("creates action with connectApp when ldmkConnectApp is disabled", () => {
    useFeature.mockReturnValue({ enabled: false });
    const mockExec = jest.fn();
    mockConnectApp.mockReturnValue(mockExec);

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(mockConnectApp).toHaveBeenCalledWith({
      isLdmkConnectAppEnabled: false,
    });
    expect(mockCreateAction).toHaveBeenCalledWith(mockExec, getViewKeyExec);
  });

  it("creates action with ldmk connectApp when ldmkConnectApp is enabled", () => {
    useFeature.mockReturnValue({ enabled: true });
    const mockExec = jest.fn();
    mockConnectApp.mockReturnValue(mockExec);

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(mockConnectApp).toHaveBeenCalledWith({
      isLdmkConnectAppEnabled: true,
    });
  });

  it("uses provided connectAppExec override instead of default", () => {
    const customExec = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: customExec,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(customExec, getViewKeyExec);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });

  it("uses provided viewKeyExec override instead of default", () => {
    const customConnectExec = jest.fn();
    const customViewKeyExec = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: customConnectExec,
        viewKeyExec: customViewKeyExec,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(customConnectExec, customViewKeyExec);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });

  it("correctly partitions confirmedAccountIds and rejectedAccountIds", () => {
    mockUseHook.mockReturnValue({
      ...mockHookState,
      shareProgress: {
        completed: 2,
        total: 2,
        viewKeys: { acc1: "vk1", acc2: null },
      },
    });

    const { result } = renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1, mockAccount2],
        currency: mockCurrency,
      }),
    );

    expect(result.current.confirmedAccountIds).toEqual(new Set(["acc1"]));
    expect(result.current.rejectedAccountIds).toEqual(new Set(["acc2"]));
  });

  it("returns request with correct appName, accounts, and currency", () => {
    const { result } = renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
      }),
    );

    expect(result.current.request).toEqual({
      appName: "Aleo",
      selectedAccounts: [mockAccount1],
      currency: mockCurrency,
    });
  });

  it("passes both connectAppExec and viewKeyExec overrides (mock mode)", () => {
    const mockedEmitter = jest.fn();

    renderHook(() =>
      useAleoViewKeyApproval({
        device: mockDevice,
        selectedAccounts: [mockAccount1],
        currency: mockCurrency,
        connectAppExec: mockedEmitter,
        viewKeyExec: mockedEmitter,
      }),
    );

    expect(mockCreateAction).toHaveBeenCalledWith(mockedEmitter, mockedEmitter);
    expect(mockConnectApp).not.toHaveBeenCalled();
  });
});

describe("buildAccountsWithViewKeys", () => {
  it("returns patched accounts for entries present in the map", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], {
      acc1: "vk1",
      acc2: "vk2",
    });

    expect(result).toEqual([
      expect.objectContaining({ id: "acc1:patched:vk1" }),
      expect.objectContaining({ id: "acc2:patched:vk2" }),
    ]);
  });

  it("skips accounts whose view key is null", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], {
      acc1: "vk1",
      acc2: null,
    });

    expect(result).toEqual([expect.objectContaining({ id: "acc1:patched:vk1" })]);
  });

  it("skips accounts absent from the view keys map", () => {
    const result = buildAccountsWithViewKeys([mockAccount1, mockAccount2], {
      acc1: "vk1",
    });

    expect(result).toEqual([expect.objectContaining({ id: "acc1:patched:vk1" })]);
  });

  it("returns empty array when no view keys match", () => {
    const result = buildAccountsWithViewKeys([mockAccount1], {});
    expect(result).toEqual([]);
  });

  it("returns empty array for empty accounts input", () => {
    const result = buildAccountsWithViewKeys([], { acc1: "vk1" });
    expect(result).toEqual([]);
  });
});

jest.mock("../../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

const { getAccountBridge } = jest.requireMock("../../bridge");

interface TestState {
  accounts: Account[];
}

function accountsTestReducer(
  state: TestState = { accounts: [] },
  action: {
    type: string;
    payload?: { accountId: string; updater: (a: Account) => Account };
  },
): TestState {
  if (action.type === "UPDATE_ACCOUNT" && action.payload) {
    const { accountId, updater } = action.payload;
    return {
      accounts: state.accounts.map(a => (a.id === accountId ? updater(a) : a)),
    };
  }
  return state;
}

const accountSelector = (state: unknown, { accountId }: { accountId: string }) =>
  (state as TestState).accounts.find(a => a.id === accountId);

const updateAccountWithUpdater = jest.fn((accountId: string, updater: (a: Account) => Account) => ({
  type: "UPDATE_ACCOUNT",
  payload: { accountId, updater },
}));

const useTestAleoPrivateSync = (
  options: Omit<
    Parameters<typeof useAleoPrivateSync>[0],
    "accountSelector" | "updateAccountWithUpdater"
  >,
) => useAleoPrivateSync({ ...options, accountSelector, updateAccountWithUpdater });

function renderAleoPrivateSync<Props = void>(
  hook: (props: Props) => ReturnType<typeof useTestAleoPrivateSync>,
  options: { initialState?: TestState; initialProps?: Props } = {},
) {
  const { initialState = { accounts: [] }, initialProps } = options;
  const store = configureStore({
    reducer: accountsTestReducer,
    preloadedState: initialState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  });

  return {
    store,
    ...renderHook(hook, {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store } as React.ComponentProps<typeof Provider>, children),
      initialProps,
    }),
  };
}

describe("useAleoPrivateSync", () => {
  let syncSubject: Subject<(acc: AleoAccount) => AleoAccount>;
  let mockSync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    syncSubject = new Subject();
    mockSync = jest.fn().mockReturnValue(syncSubject.asObservable());
    getAccountBridge.mockReturnValue({ sync: mockSync });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("autoStart: false (default)", () => {
    it("should not call sync on mount", () => {
      renderAleoPrivateSync(() => useTestAleoPrivateSync({ account: makeAleoAccount() }));

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should have isSyncing as false and progress as 0 initially", () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it("should call sync and set isSyncing to true when start() is called", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(result.current.isSyncing).toBe(true);
    });

    it("should set progress to 100 when next is emitted from the bridge observable", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      expect(result.current.progress).toBe(100);
    });

    it("should update progress via aleoPrivateSyncProgress$ emissions", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 42 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(42);
    });

    it("should set error and stop syncing when the observable errors", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.error(new Error("network failure"));
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.error).toMatchObject({
        message: "network failure",
      });
    });

    it("should clear error when start() is called again after an error", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.error(new Error("network failure"));
      });

      // Rebuild subject for the retry
      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      await act(async () => {
        result.current.start();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isSyncing).toBe(true);
    });

    it("should set isSyncing to false when stop() is called", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        result.current.stop();
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it("should set isSyncing to false when complete fires with synced=true", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
        syncSubject.complete();
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(100);
    });

    it("should retry when complete fires without any result (scanner not yet ready)", async () => {
      jest.useFakeTimers();
      const firstSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      const secondSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      mockSync
        .mockReturnValueOnce(firstSubject.asObservable())
        .mockReturnValueOnce(secondSubject.asObservable());

      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      act(() => {
        result.current.start();
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      // Complete without emitting next — scanner returned null, retry expected
      act(() => {
        firstSubject.complete();
      });

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(result.current.isSyncing).toBe(true);

      act(() => {
        jest.advanceTimersByTime(MANDATORY_SYNC_POLLING_DELAY);
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for retry

      expect(mockSync).toHaveBeenCalledTimes(2);

      act(() => {
        secondSubject.next(() => makeAleoAccount(100, true));
        secondSubject.complete();
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it("should retry after polling delay when complete fires without any result", async () => {
      jest.useFakeTimers();
      const firstSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      const secondSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      mockSync
        .mockReturnValueOnce(firstSubject.asObservable())
        .mockReturnValueOnce(secondSubject.asObservable());

      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      act(() => {
        result.current.start();
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      // Complete without any next emission — triggers retry after delay
      act(() => {
        firstSubject.complete();
      });

      expect(mockSync).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(MANDATORY_SYNC_POLLING_DELAY);
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for retry

      expect(mockSync).toHaveBeenCalledTimes(2);

      act(() => {
        // Second observable also completes without result — stop manually to avoid infinite retry
        result.current.stop();
      });
    });

    it("should not retry when stop() is called before complete fires", async () => {
      jest.useFakeTimers();
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      act(() => {
        result.current.start();
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      // stop() unsubscribes before the observable completes naturally
      act(() => {
        result.current.stop();
      });

      // Any further timer advances should not trigger a second sync call
      act(() => {
        jest.advanceTimersByTime(MANDATORY_SYNC_POLLING_DELAY);
      });

      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should not call sync for a non-Aleo account", async () => {
      const nonAleoAccount = genAccount("btc-1", {
        currency: getCryptoCurrencyById("bitcoin"),
      });
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: nonAleoAccount }),
      );

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should not throw when events arrive after unmount", async () => {
      const { result, unmount } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      unmount();

      // Emitting after unmount should not throw (subscription was cleaned up)
      await act(async () => {
        try {
          syncSubject.next(() => makeAleoAccount(75));
        } catch {
          // noop — we only assert no crash and progress unchanged
        }
      });

      expect(result.current.progress).toBe(0);
    });
  });

  describe("autoStart: true", () => {
    it("should call sync immediately on mount", async () => {
      renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should have isSyncing as true on mount", () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );

      expect(result.current.isSyncing).toBe(true);
    });

    it("should update progress and finish when observable completes with synced=true", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );

      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
        syncSubject.complete();
      });

      expect(result.current.progress).toBe(100);
      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe("onAccountUpdated callback", () => {
    it("should call onAccountUpdated with the updated account on each emission", async () => {
      const onAccountUpdated = jest.fn();
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount(), onAccountUpdated }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(50));
      });

      expect(onAccountUpdated).toHaveBeenCalledTimes(1);
      expect(
        onAccountUpdated.mock.calls[0][0].aleoResources.provableApi.scannerStatus.percentage,
      ).toBe(50);
    });

    it("should call onAccountUpdated on each emission independently", async () => {
      const onAccountUpdated = jest.fn();
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount(), onAccountUpdated }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(30));
        syncSubject.next(() => makeAleoAccount(60));
      });

      expect(onAccountUpdated).toHaveBeenCalledTimes(2);
    });

    it("should not call onAccountUpdated when not provided", async () => {
      // No onAccountUpdated — just confirm it doesn't throw and progress reaches 100
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      expect(result.current.progress).toBe(100);
    });

    it("should use the latest onAccountUpdated ref without restarting sync", async () => {
      const first = jest.fn();
      const second = jest.fn();

      const { result, rerender } = renderAleoPrivateSync(
        ({ cb }: { cb: typeof first }) =>
          useTestAleoPrivateSync({
            account: makeAleoAccount(),
            onAccountUpdated: cb,
          }),
        { initialProps: { cb: first } },
      );

      await act(async () => {
        result.current.start();
      });

      // Swap callback without restarting
      rerender({ cb: second });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(70));
      });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("aleoPrivateSyncProgress$ edge cases", () => {
    it("should ignore progress events for a different accountId", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({
          accountId: "different-account-id",
          progress: 60,
        });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(0);
    });

    it("should ignore progress events with null progress", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({
          accountId: account.id,
          progress: null,
        });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(0);
    });

    it("should not decrease progress (Math.max behaviour)", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 70 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 30 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(70);
    });

    it("should ignore progress events when not syncing", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account }));

      // Do not call start() — isSyncing is false
      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 55 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(0);
    });
  });

  describe("start() called while already syncing", () => {
    it("should reset progress to 0 and re-subscribe when start() is called again", async () => {
      const firstSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      const secondSubject = new Subject<(acc: AleoAccount) => AleoAccount>();
      mockSync
        .mockReturnValueOnce(firstSubject.asObservable())
        .mockReturnValueOnce(secondSubject.asObservable());

      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      // Advance partial progress
      await act(async () => {
        firstSubject.next(() => makeAleoAccount(50));
      });

      expect(result.current.progress).toBe(100);

      // Calling start() again should reset
      await act(async () => {
        result.current.start();
      });

      expect(result.current.progress).toBe(0);
      expect(result.current.isSyncing).toBe(true);
      expect(mockSync).toHaveBeenCalledTimes(2);
    });

    it("should clear a previous error when start() is called while an error is set", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.error(new Error("first error"));
      });

      expect(result.current.error).not.toBeNull();

      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      await act(async () => {
        result.current.start();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("dispatch behaviour", () => {
    it("should dispatch updateAccountWithUpdater on each sync emission", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(50));
      });

      expect(updateAccountWithUpdater).toHaveBeenCalledTimes(1);
      expect(updateAccountWithUpdater).toHaveBeenCalledWith(
        ALEO_ACCOUNT_1.id,
        expect.any(Function),
      );
    });

    it("should dispatch once per emission when multiple next values arrive", async () => {
      const { result } = renderAleoPrivateSync(() =>
        useTestAleoPrivateSync({ account: makeAleoAccount() }),
      );

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(33));
        syncSubject.next(() => makeAleoAccount(66));
      });

      expect(updateAccountWithUpdater).toHaveBeenCalledTimes(2);
    });
  });

  describe("account: null / undefined", () => {
    it("should not call sync when account is null", async () => {
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account: null }));

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should return isSyncing=false and progress=0 when account is null", () => {
      const { result } = renderAleoPrivateSync(() => useTestAleoPrivateSync({ account: null }));

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe("keepAliveOnUnmount: true", () => {
    it("should keep the sync running after unmount (bridge subscription not cancelled)", async () => {
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            onAccountUpdated,
          }),
        { initialState: { accounts: [account] } },
      );

      await act(async () => {
        result.current.start();
      });

      unmount();

      // Emitting after unmount should still call onAccountUpdated (sync is alive)
      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      expect(onAccountUpdated).toHaveBeenCalledTimes(1);
    });

    it("should adopt registry state when component remounts while sync is running", async () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const initialState = { accounts: [account] };

      const { result: first, unmount } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            autoStart: true,
          }),
        { initialState },
      );
      const stop = first.current.stop;

      // Flush from(Promise.resolve(bridge)) microtask so mockSync is subscribed
      await Promise.resolve();

      // Advance some progress via the progress subject
      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 55 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(first.current.progress).toBe(55);

      unmount();

      // Remount — should pick up isSyncing=true and progress=55 from registry
      const { result: second } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            autoStart: true,
          }),
        { initialState },
      );

      expect(second.current.isSyncing).toBe(true);
      expect(second.current.progress).toBe(55);
      // Should NOT have started a second bridge sync
      expect(mockSync).toHaveBeenCalledTimes(1);

      // Cleanup: avoid leaking registry/store subscriptions into other tests
      act(() => stop());
    });

    it("should dispatch to Redux and call onAccountUpdated after unmount (isMountedRef only guards state setters)", async () => {
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            onAccountUpdated,
          }),
        { initialState: { accounts: [account] } },
      );

      await act(async () => {
        result.current.start();
      });

      unmount();

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      // Non-state side-effects are NOT guarded by isMountedRef
      expect(updateAccountWithUpdater).toHaveBeenCalledTimes(1);
      expect(onAccountUpdated).toHaveBeenCalledTimes(1);
    });

    it("should not crash and not set error state when the keepAlive sync errors after unmount", async () => {
      const account = makeAleoAccount();
      const { result, unmount } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account, keepAliveOnUnmount: true }),
        { initialState: { accounts: [account] } },
      );

      await act(async () => {
        result.current.start();
      });

      unmount();

      // Error fires after unmount — isMountedRef prevents setError/setIsSyncing
      await act(async () => {
        syncSubject.error(new Error("post-unmount error"));
      });

      expect(result.current.error).toBeNull();
    });

    it("should clear the registry after sync completes so a remounted hook starts a fresh sync", async () => {
      const account = makeAleoAccount();
      const initialState = { accounts: [account] };

      const { result, unmount } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account, keepAliveOnUnmount: true }),
        { initialState },
      );

      await act(async () => {
        result.current.start();
      });

      // Sync completes — keepAliveOnUnmountRef branch clears the registry entry
      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
        syncSubject.complete();
      });

      unmount();

      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      // Remount with autoStart: no live registry entry, so a fresh sync is started
      const { result: second } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            autoStart: true,
          }),
        { initialState },
      );

      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for second sync

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(second.current.isSyncing).toBe(true);
    });

    it("should clear the registry after sync errors so a remounted hook starts a fresh sync", async () => {
      const account = makeAleoAccount();
      const initialState = { accounts: [account] };

      const { result, unmount } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account, keepAliveOnUnmount: true }),
        { initialState },
      );

      await act(async () => {
        result.current.start();
      });

      unmount();

      // Error fires after unmount — keepAliveOnUnmountRef branch clears the registry entry
      await act(async () => {
        syncSubject.error(new Error("sync error"));
      });

      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      // Remount with autoStart: no live registry entry, so a fresh sync is started
      const { result: second } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            autoStart: true,
          }),
        { initialState },
      );

      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for second sync

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(second.current.isSyncing).toBe(true);
    });

    it("should store the RxJS subscription in the registry so stop() can cancel it after unmount", async () => {
      const account = makeAleoAccount();
      const { result, unmount } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account, keepAliveOnUnmount: true }),
        { initialState: { accounts: [account] } },
      );

      await act(async () => {
        result.current.start();
      });

      const stopFn = result.current.stop;
      unmount();

      // stop() retrieves entry.sub from the registry and unsubscribes it
      await act(async () => {
        stopFn();
      });

      const onAccountUpdated = jest.fn();
      // Bind a fresh callback — original hook is gone, but the subscription should be dead
      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      // No callback wired here, but the key assertion is that dispatch was NOT called
      expect(updateAccountWithUpdater).not.toHaveBeenCalled();
      expect(onAccountUpdated).not.toHaveBeenCalled();
    });

    it("should cancel the keep-alive subscription when stop() is called after unmount", async () => {
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderAleoPrivateSync(
        () =>
          useTestAleoPrivateSync({
            account,
            keepAliveOnUnmount: true,
            onAccountUpdated,
          }),
        { initialState: { accounts: [account] } },
      );

      await act(async () => {
        result.current.start();
      });

      const stopFn = result.current.stop;
      unmount();

      await act(async () => {
        stopFn();
      });

      // Emitting now should be ignored — subscription was cancelled
      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100, true));
      });

      expect(onAccountUpdated).not.toHaveBeenCalled();
    });
  });

  describe("external completion via aleoPrivateSyncProgress$", () => {
    it("should call onAccountUpdated immediately when Redux has already flushed lastPrivateSyncDate", async () => {
      jest.useFakeTimers();
      const onAccountUpdated = jest.fn();
      const syncDate = new Date();
      const baseAccount = makeAleoAccount(100, true);
      const syncedAccount: AleoAccount = {
        ...baseAccount,
        aleoResources: {
          ...baseAccount.aleoResources!,
          lastPrivateSyncDate: syncDate,
        },
      };

      const { result } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account: syncedAccount, onAccountUpdated }),
        { initialState: { accounts: [syncedAccount] } },
      );

      act(() => {
        result.current.start();
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      // Complete without a result — subscriptionRef becomes null, retry timer pending
      act(() => {
        syncSubject.complete();
      });

      // A keepAlive instance emits progress=100; liveAccount already has lastPrivateSyncDate
      act(() => {
        aleoPrivateSyncProgress$.next({
          accountId: syncedAccount.id,
          progress: 100,
        });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.isSyncing).toBe(false);
      expect(onAccountUpdated).toHaveBeenCalledTimes(1);
      expect(onAccountUpdated).toHaveBeenCalledWith(syncedAccount);
    });

    it("should defer onAccountUpdated via the liveAccount effect when Redux has not yet flushed", async () => {
      jest.useFakeTimers();
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();

      const { result, store } = renderAleoPrivateSync(
        () => useTestAleoPrivateSync({ account, onAccountUpdated }),
        { initialState: { accounts: [account] } },
      );

      act(() => {
        result.current.start();
      });
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      // Complete without a result — subscriptionRef becomes null, retry timer pending
      act(() => {
        syncSubject.complete();
      });

      // External progress=100 arrives; liveAccount still lacks lastPrivateSyncDate
      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: 100 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      // pendingExternalCompletionRef is now true, but onAccountUpdated not yet fired
      expect(onAccountUpdated).not.toHaveBeenCalled();
      expect(result.current.isSyncing).toBe(false);

      // Simulate Redux catching up: dispatch UPDATE_ACCOUNT with lastPrivateSyncDate set
      const syncDate = new Date();
      act(() => {
        store.dispatch({
          type: "UPDATE_ACCOUNT",
          payload: {
            accountId: account.id,
            updater: (acc: AleoAccount): AleoAccount => ({
              ...acc,
              aleoResources: {
                ...acc.aleoResources!,
                lastPrivateSyncDate: syncDate,
              },
            }),
          },
        });
      });

      expect(onAccountUpdated).toHaveBeenCalledTimes(1);
      expect(onAccountUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          aleoResources: expect.objectContaining({
            lastPrivateSyncDate: syncDate,
          }),
        }),
      );
    });
  });
});

function makeRecord(microcredits: string): AleoUnspentRecord {
  return { microcredits } as unknown as AleoUnspentRecord;
}

function makeAccountWithRecords(records: AleoUnspentRecord[]): AleoAccount {
  return {
    ...ALEO_ACCOUNT_1,
    aleoResources: {
      transparentBalance: new BigNumber(0),
      privateBalance: new BigNumber(0),
      unspentPrivateRecords: records,
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  } as AleoAccount;
}

function makePrivateTransaction(overrides?: Record<string, unknown>): Transaction {
  return {
    family: "aleo",
    mode: "transfer_private",
    amount: new BigNumber(0),
    useAllAmount: false,
    properties: { amountRecordCommitments: [], feeRecordCommitment: null },
    ...overrides,
  } as unknown as Transaction;
}

describe("useAleoQuickAmountSelector", () => {
  // 16 records, descending: 2000000, 1900000, ... 500000
  const manyRecords = Array.from({ length: 16 }, (_, i) => makeRecord(`${(20 - i) * 100000}`));
  // 6 records, descending: 600000 .. 100000
  const sixRecords = Array.from({ length: 6 }, (_, i) => makeRecord(`${(6 - i) * 100000}`));

  it("throws for an account of another family", () => {
    const account = {
      ...makeAccountWithRecords(manyRecords),
      currency: { ...ALEO_ACCOUNT_1.currency, family: "bitcoin" },
    };
    const transaction = makePrivateTransaction();

    expect(() =>
      renderHook(() =>
        useAleoQuickAmountSelector({
          account,
          transaction,
          updateTransaction: jest.fn(),
        }),
      ),
    ).toThrow();
  });

  it("still computes tiles for a public-mode aleo transaction — privacy gating is a caller concern", () => {
    const account = makeAccountWithRecords(manyRecords);
    const transaction = makePrivateTransaction({ mode: "transfer_public" });

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({
        account,
        transaction,
        updateTransaction: jest.fn(),
      }),
    );

    expect(result.current.strategyData).toHaveLength(3);
    expect(result.current.selectedRecordsCount).toBe(0);
  });

  it("computes fast/balanced/full tiers from the sorted unspent records", () => {
    const account = makeAccountWithRecords(manyRecords);
    const transaction = makePrivateTransaction();

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({
        account,
        transaction,
        updateTransaction: jest.fn(),
      }),
    );

    expect(result.current.strategyData.map(tile => tile.strategy)).toEqual([
      "fast",
      "balanced",
      "full",
    ]);
    expect(result.current.strategyData.map(tile => tile.availableCount)).toEqual([4, 8, 14]);
    expect(result.current.strategyData.map(tile => tile.rangeSum.toString())).toEqual([
      "7400000",
      "13200000",
      "18900000",
    ]);
    expect(result.current.totalSpendableBalance.toString()).toBe("18900000");
  });

  it("disables tiers past the available record count and marks the last reachable tier as send-max", () => {
    const account = makeAccountWithRecords(sixRecords);
    const transaction = makePrivateTransaction();

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({
        account,
        transaction,
        updateTransaction: jest.fn(),
      }),
    );

    const [fast, balanced, full] = result.current.strategyData;
    expect(fast.disabled).toBe(false);
    expect(balanced.disabled).toBe(false);
    expect(balanced.isSendMax).toBe(true);
    expect(full.disabled).toBe(true);
  });

  it("selectStrategy calls updateTransaction with the tier sum for a non-max tile", () => {
    const account = makeAccountWithRecords(manyRecords);
    const transaction = makePrivateTransaction();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({ account, transaction, updateTransaction }),
    );

    result.current.selectStrategy(result.current.strategyData[0]);

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    const updated = updateTransaction.mock.calls[0][0](transaction);
    expect(updated.useAllAmount).toBe(false);
    expect((updated.amount as BigNumber).toString()).toBe("7400000");
  });

  it("selectStrategy calls updateTransaction with useAllAmount for the capped full tile", () => {
    const account = makeAccountWithRecords(manyRecords);
    const transaction = makePrivateTransaction();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({ account, transaction, updateTransaction }),
    );

    result.current.selectStrategy(result.current.strategyData[2]);

    const updated = updateTransaction.mock.calls[0][0](transaction);
    expect(updated.useAllAmount).toBe(true);
  });

  it("selectStrategy does nothing for a disabled tile", () => {
    const account = makeAccountWithRecords(sixRecords);
    const transaction = makePrivateTransaction();
    const updateTransaction = jest.fn();

    const { result } = renderHook(() =>
      useAleoQuickAmountSelector({ account, transaction, updateTransaction }),
    );

    result.current.selectStrategy(result.current.strategyData[2]);

    expect(updateTransaction).not.toHaveBeenCalled();
  });
});
