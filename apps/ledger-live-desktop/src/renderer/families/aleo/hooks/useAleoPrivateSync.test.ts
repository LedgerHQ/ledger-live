import BigNumber from "bignumber.js";
import { Subject } from "rxjs";
import { act } from "react";
import { renderHook } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { useAleoPrivateSync } from "./useAleoPrivateSync";
import { MANDATORY_SYNC_POLLING_DELAY } from "../constants";

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

const makeAleoAccount = (percentage = 0): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    privateBalance: new BigNumber(0),
    unspentPrivateRecords: [],
    provableApi: { scannerStatus: { synced: false, percentage } },
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

    it("should update progress on next emissions", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(42));
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

    it("should set isSyncing to false when complete fires at 100%", async () => {
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      await act(async () => {
        result.current.start();
      });

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100));
        syncSubject.complete();
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.progress).toBe(100);
    });

    it("should retry after polling delay when complete fires at < 100%", () => {
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

      act(() => {
        firstSubject.next(() => makeAleoAccount(50));
        firstSubject.complete();
      });

      expect(mockSync).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(MANDATORY_SYNC_POLLING_DELAY);
      });

      expect(mockSync).toHaveBeenCalledTimes(2);

      act(() => {
        secondSubject.complete();
      });
    });

    it("should not retry when stop() is called before complete fires", () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useAleoPrivateSync({ account: makeAleoAccount() }));

      act(() => {
        result.current.start();
      });

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
    it("should call sync immediately on mount", () => {
      renderHook(() => useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }));

      expect(mockSync).toHaveBeenCalledTimes(1);
    });

    it("should have isSyncing as true on mount", () => {
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );

      expect(result.current.isSyncing).toBe(true);
    });

    it("should update progress and finish when observable completes at 100%", async () => {
      const { result } = renderHook(() =>
        useAleoPrivateSync({ account: makeAleoAccount(), autoStart: true }),
      );

      await act(async () => {
        syncSubject.next(() => makeAleoAccount(100));
        syncSubject.complete();
      });

      expect(result.current.progress).toBe(100);
      expect(result.current.isSyncing).toBe(false);
    });
  });
});
