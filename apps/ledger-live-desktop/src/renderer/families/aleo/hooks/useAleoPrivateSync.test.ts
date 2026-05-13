import BigNumber from "bignumber.js";
import { Subject } from "rxjs";
import { act } from "react";
import { renderHook } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { aleoPrivateSyncProgress$ } from "@ledgerhq/live-common/families/aleo/privateSyncProgress";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { useAleoPrivateSync } from "./useAleoPrivateSync";
import { MANDATORY_SYNC_POLLING_DELAY, PROGRESS_THROTTLE_INTERVAL_MS } from "../constants";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("~/renderer/actions/accounts", () => ({
  ...jest.requireActual("~/renderer/actions/accounts"),
  updateAccountWithUpdater: jest
    .fn()
    .mockImplementation((accountId: string, updater: (a: unknown) => unknown) => ({
      type: "UPDATE_ACCOUNT",
      payload: { accountId, updater },
    })),
}));

const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");

const makeAleoAccount = (percentage = 0, synced = false): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    privateBalance: new BigNumber(0),
    unspentPrivateRecords: [],
    provableApi: { scannerStatus: { synced, percentage } },
    lastPrivateSyncDate: null,
  },
});

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
      renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should have isSyncing as false and progress as 0 initially", () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it("should call sync and set isSyncing to true when start() is called", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).toHaveBeenCalledTimes(1);
      expect(result.current.isSyncing).toBe(true);
    });

    it("should set progress to 100 when next is emitted from the bridge observable", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.error(new Error("network failure"));
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.error).toMatchObject({ message: "network failure" });
    });

    it("should clear error when start() is called again after an error", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        result.current.stop();
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it("should set isSyncing to false when complete fires with synced=true", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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

      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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

      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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

    it("should not call sync for a non-Aleo account (no aleoResources)", async () => {
      // Plain account without aleoResources — isAleoAccount returns false
      const { result } = renderHook(() => useAleoPrivateSync({ account: { ...ALEO_ACCOUNT_1 } }));

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should not throw when events arrive after unmount", async () => {
      const { result, unmount } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount() }),
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
      renderHook(() => useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }));
      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask

      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should have isSyncing as true on mount", () => {
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );

      expect(result.current.isSyncing).toBe(true);
    });

    it("should update progress and finish when observable completes with synced=true", async () => {
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
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
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), onAccountUpdated }),
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
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), onAccountUpdated }),
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
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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

      const { result, rerender } = renderHook(
        ({ cb }: { cb: typeof first }) =>
          useAleoPrivateSync({ account: makeAleoAccount(), onAccountUpdated: cb }),
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
      const { result } = renderHook(() => useAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: "different-account-id", progress: 60 });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(0);
    });

    it("should ignore progress events with null progress", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderHook(() => useAleoPrivateSync({ account }));

      act(() => {
        result.current.start();
      });

      act(() => {
        aleoPrivateSyncProgress$.next({ accountId: account.id, progress: null });
        jest.advanceTimersByTime(PROGRESS_THROTTLE_INTERVAL_MS + 100);
      });

      expect(result.current.progress).toBe(0);
    });

    it("should not decrease progress (Math.max behaviour)", () => {
      jest.useFakeTimers();
      const account = makeAleoAccount();
      const { result } = renderHook(() => useAleoPrivateSync({ account }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account }));

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

      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { updateAccountWithUpdater } = jest.requireMock("~/renderer/actions/accounts");
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { updateAccountWithUpdater } = jest.requireMock("~/renderer/actions/accounts");
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

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
      const { result } = renderHook(() => useAleoPrivateSync({ account: null }));

      await act(async () => {
        result.current.start();
      });

      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should return isSyncing=false and progress=0 when account is null", () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: null }));

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe("keepAliveOnUnmount: true", () => {
    it("should keep the sync running after unmount (bridge subscription not cancelled)", async () => {
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, onAccountUpdated }),
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

      const { result: first, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, autoStart: true }),
        { initialState },
      );

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
      const { result: second } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, autoStart: true }),
        { initialState },
      );

      expect(second.current.isSyncing).toBe(true);
      expect(second.current.progress).toBe(55);
      // Should NOT have started a second bridge sync
      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should dispatch to Redux and call onAccountUpdated after unmount (isMountedRef only guards state setters)", async () => {
      const { updateAccountWithUpdater } = jest.requireMock("~/renderer/actions/accounts");
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, onAccountUpdated }),
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
      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true }),
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

      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true }),
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
      const { result: second } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, autoStart: true }),
        { initialState },
      );

      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for second sync

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(second.current.isSyncing).toBe(true);
    });

    it("should clear the registry after sync errors so a remounted hook starts a fresh sync", async () => {
      const account = makeAleoAccount();
      const initialState = { accounts: [account] };

      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true }),
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
      const { result: second } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, autoStart: true }),
        { initialState },
      );

      await Promise.resolve(); // flush from(Promise.resolve(bridge)) microtask for second sync

      expect(mockSync).toHaveBeenCalledTimes(2);
      expect(second.current.isSyncing).toBe(true);
    });

    it("should store the RxJS subscription in the registry so stop() can cancel it after unmount", async () => {
      const account = makeAleoAccount();
      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true }),
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
      const { updateAccountWithUpdater } = jest.requireMock("~/renderer/actions/accounts");
      expect(updateAccountWithUpdater).not.toHaveBeenCalled();
      expect(onAccountUpdated).not.toHaveBeenCalled();
    });

    it("should cancel the keep-alive subscription when stop() is called after unmount", async () => {
      const onAccountUpdated = jest.fn();
      const account = makeAleoAccount();
      const { result, unmount } = renderHook(
        () => useAleoPrivateSync({ account, keepAliveOnUnmount: true, onAccountUpdated }),
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

      const { result } = renderHook(
        () => useAleoPrivateSync({ account: syncedAccount, onAccountUpdated }),
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
        aleoPrivateSyncProgress$.next({ accountId: syncedAccount.id, progress: 100 });
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

      const { result, store } = renderHook(
        () => useAleoPrivateSync({ account, onAccountUpdated }),
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
          aleoResources: expect.objectContaining({ lastPrivateSyncDate: syncDate }),
        }),
      );
    });
  });
});
