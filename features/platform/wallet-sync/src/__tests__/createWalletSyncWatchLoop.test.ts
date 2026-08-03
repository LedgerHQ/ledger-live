/**
 * @jest-environment node
 */
import { z } from "zod";
import { WalletSyncDataManager } from "@shared/wallet-sync";
import { createWalletSyncWatchLoop } from "../walletsync/createWalletSyncWatchLoop";
import type {
  CreateWalletSyncWatchLoopParams,
  VisualConfig,
  WatchConfig,
} from "../walletsync/createWalletSyncWatchLoop";

type LocalState = { value: string };
type Update = { newValue: string };
const schema = z.object({ value: z.string() });
type DistantState = z.infer<typeof schema>;

const trustchain = { rootId: "root", walletSyncEncryptionKey: "key", applicationPath: "path" };
const memberCredentials = { pubkey: "pub", privatekey: "priv" };

function makeModule(
  overrides: Partial<WalletSyncDataManager<LocalState, Update, typeof schema>> = {},
): WalletSyncDataManager<LocalState, Update, typeof schema> {
  return {
    schema,
    diffLocalToDistant: jest.fn(() => ({ hasChanges: false, nextState: { value: "distant" } })),
    resolveIncrementalUpdate: jest.fn(async () => ({ hasChanges: false as const })),
    applyUpdate: jest.fn((local: LocalState) => local),
    ...overrides,
  };
}

/**
 * Minimal stand-in for the notifications Observable, so this package keeps no rxjs dependency.
 * The loop only ever calls `.subscribe()` and `.unsubscribe()`.
 */
function makeNotifications() {
  const listeners = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return { unsubscribe: () => listeners.delete(cb) };
    },
    emit: () => listeners.forEach(l => l()),
    get subscribed() {
      return listeners.size > 0;
    },
  };
}

function makeSdk(overrides: Record<string, unknown> = {}) {
  return {
    pull: jest.fn(async () => {}),
    push: jest.fn(async () => {}),
    destroy: jest.fn(async () => {}),
    listenNotifications: jest.fn(() => makeNotifications()),
    ...overrides,
  };
}

type Params = CreateWalletSyncWatchLoopParams<
  { local: LocalState; distant: DistantState | null },
  LocalState,
  Update,
  typeof schema
>;

type Overrides = Partial<{
  walletsync: ReturnType<typeof makeModule>;
  walletSyncSdk: ReturnType<typeof makeSdk>;
  localIncrementUpdate: jest.Mock;
  onTrustchainRefreshNeeded: jest.Mock;
  onError: jest.Mock | undefined;
  onStartPolling: jest.Mock | undefined;
  setVisualPending: jest.Mock | undefined;
  watchConfig: WatchConfig;
  visualConfig: VisualConfig;
}>;

function setup(overrides: Overrides = {}) {
  const state = { local: { value: "local" }, distant: { value: "distant" } as DistantState | null };
  const params = {
    walletsync: makeModule(),
    walletSyncSdk: makeSdk(),
    trustchain,
    memberCredentials,
    localIncrementUpdate: jest.fn(async () => {}),
    onTrustchainRefreshNeeded: jest.fn(async () => {}),
    onError: jest.fn(),
    onStartPolling: jest.fn(),
    setVisualPending: jest.fn(),
    getState: () => state,
    localStateSelector: (s: typeof state) => s.local,
    latestDistantStateSelector: (s: typeof state) => s.distant,
    isTrustchainRefreshError: (e: unknown) => e instanceof Error && e.name === "NeedsRefresh",
    ...overrides,
  };

  const handle = createWalletSyncWatchLoop(params as unknown as Params);
  return { handle, state, ...params };
}

/** Let the loop's pending promise chain settle without advancing timers. */
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

describe("createWalletSyncWatchLoop", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("scheduling", () => {
    it("applies default timings when no watchConfig is provided", async () => {
      const { walletSyncSdk, handle } = setup();

      // defaults: initialTimeout 1000ms, pollingInterval 10000ms
      jest.advanceTimersByTime(999);
      await flush();
      expect(walletSyncSdk.pull).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(10_000);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(2);
      handle.unsubscribe();
    });

    it("does not run before the initial timeout elapses", async () => {
      const { walletSyncSdk, handle } = setup();
      await flush();
      expect(walletSyncSdk.pull).not.toHaveBeenCalled();
      handle.unsubscribe();
    });

    it("runs a first pass after the initial timeout", async () => {
      const { walletSyncSdk, handle } = setup({ watchConfig: { initialTimeout: 50 } });
      jest.advanceTimersByTime(50);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledWith(trustchain, memberCredentials);
      handle.unsubscribe();
    });

    it("keeps polling on the configured interval", async () => {
      const { walletSyncSdk, handle } = setup({
        watchConfig: { initialTimeout: 10, pollingInterval: 100 },
      });
      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(100);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(3);
      handle.unsubscribe();
    });

    it("abandons a pass unsubscribed while the pull is in flight", async () => {
      let resolvePull: () => void = () => {};
      const walletSyncSdk = makeSdk({
        pull: jest.fn(() => new Promise<void>(resolve => (resolvePull = resolve))),
      });
      const { localIncrementUpdate, handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      handle.unsubscribe();
      resolvePull();
      await flush();

      expect(localIncrementUpdate).not.toHaveBeenCalled();
      expect(walletSyncSdk.push).not.toHaveBeenCalled();
    });

    it("abandons a pass unsubscribed while the local update is in flight", async () => {
      let resolveLocal: () => void = () => {};
      const localIncrementUpdate = jest.fn(
        () => new Promise<void>(resolve => (resolveLocal = resolve)),
      );
      const walletsync = makeModule({
        diffLocalToDistant: jest.fn(() => ({ hasChanges: true, nextState: { value: "next" } })),
      });
      const { walletSyncSdk, handle } = setup({
        walletsync,
        localIncrementUpdate,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(localIncrementUpdate).toHaveBeenCalled();

      handle.unsubscribe();
      resolveLocal();
      await flush();

      expect(walletsync.diffLocalToDistant).not.toHaveBeenCalled();
      expect(walletSyncSdk.push).not.toHaveBeenCalled();
    });

    it("stops polling after unsubscribe", async () => {
      const { walletSyncSdk, handle } = setup({
        watchConfig: { initialTimeout: 10, pollingInterval: 100 },
      });
      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);

      handle.unsubscribe();
      jest.advanceTimersByTime(1000);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);
    });
  });

  describe("onUserRefreshIntent", () => {
    it("reschedules the next run to the debounce delay", async () => {
      const { walletSyncSdk, handle } = setup({
        watchConfig: { initialTimeout: 10_000, userIntentDebounce: 50 },
      });

      handle.onUserRefreshIntent();
      jest.advanceTimersByTime(50);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);
      handle.unsubscribe();
    });

    it("debounces bursts of intents into a single run", async () => {
      const { walletSyncSdk, handle } = setup({
        watchConfig: { initialTimeout: 10_000, userIntentDebounce: 50 },
      });

      handle.onUserRefreshIntent();
      jest.advanceTimersByTime(30);
      handle.onUserRefreshIntent();
      jest.advanceTimersByTime(30);
      handle.onUserRefreshIntent();
      await flush();
      expect(walletSyncSdk.pull).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);
      handle.unsubscribe();
    });

    it("is a no-op once unsubscribed", async () => {
      const { walletSyncSdk, handle } = setup({
        watchConfig: { initialTimeout: 10_000, userIntentDebounce: 50 },
      });

      handle.unsubscribe();
      handle.onUserRefreshIntent();
      jest.advanceTimersByTime(1000);
      await flush();
      expect(walletSyncSdk.pull).not.toHaveBeenCalled();
    });
  });

  describe("push", () => {
    it("pushes the next state when the local diff has changes", async () => {
      const walletsync = makeModule({
        diffLocalToDistant: jest.fn(() => ({
          hasChanges: true,
          nextState: { value: "next" },
        })),
      });
      const { walletSyncSdk, handle } = setup({
        walletsync,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.push).toHaveBeenCalledWith(trustchain, memberCredentials, {
        value: "next",
      });
      handle.unsubscribe();
    });

    it("does not push when there is nothing to push", async () => {
      const { walletSyncSdk, handle } = setup({ watchConfig: { initialTimeout: 10 } });
      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.push).not.toHaveBeenCalled();
      handle.unsubscribe();
    });

    it("applies the local incremental update before diffing to push", async () => {
      const order: string[] = [];
      const localIncrementUpdate = jest.fn(async () => {
        order.push("localIncrementUpdate");
      });
      const walletsync = makeModule({
        diffLocalToDistant: jest.fn(() => {
          order.push("diffLocalToDistant");
          return { hasChanges: false, nextState: { value: "distant" } };
        }),
      });
      const { handle } = setup({
        walletsync,
        localIncrementUpdate,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(order).toEqual(["localIncrementUpdate", "diffLocalToDistant"]);
      handle.unsubscribe();
    });
  });

  describe("error handling", () => {
    it("reports a pull failure through onError and keeps polling", async () => {
      const walletSyncSdk = makeSdk({
        pull: jest.fn(async () => {
          throw new Error("network down");
        }),
      });
      const { onError, handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10, pollingInterval: 100 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "network down" }));

      jest.advanceTimersByTime(100);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(2);
      handle.unsubscribe();
    });

    it("triggers a trustchain refresh instead of onError for refresh errors", async () => {
      const refreshError = new Error("outdated");
      refreshError.name = "NeedsRefresh";
      const walletSyncSdk = makeSdk({
        pull: jest.fn(async () => {
          throw refreshError;
        }),
      });
      const { onError, onTrustchainRefreshNeeded, handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(onTrustchainRefreshNeeded).toHaveBeenCalledWith(trustchain);
      expect(onError).not.toHaveBeenCalled();
      handle.unsubscribe();
    });

    it("does not report errors raised after unsubscribe", async () => {
      let rejectPull: (e: Error) => void = () => {};
      const walletSyncSdk = makeSdk({
        pull: jest.fn(() => new Promise((_, reject) => (rejectPull = reject))),
      });
      const { onError, handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      handle.unsubscribe();
      rejectPull(new Error("late failure"));
      await flush();
      expect(onError).not.toHaveBeenCalled();
    });

    it("falls back to console.error when no onError handler is given", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const walletSyncSdk = makeSdk({
        pull: jest.fn(async () => {
          throw new Error("unhandled");
        }),
      });
      const { handle } = setup({
        walletSyncSdk,
        onError: undefined,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(consoleError).toHaveBeenCalledWith(expect.objectContaining({ message: "unhandled" }));
      handle.unsubscribe();
      consoleError.mockRestore();
    });

    it("runs without the optional setVisualPending and onStartPolling callbacks", async () => {
      const { walletSyncSdk, handle } = setup({
        setVisualPending: undefined,
        onStartPolling: undefined,
        watchConfig: { initialTimeout: 10 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);
      handle.unsubscribe();
    });

    it("calls onStartPolling at the beginning of each pass", async () => {
      const { onStartPolling, handle } = setup({
        watchConfig: { initialTimeout: 10, pollingInterval: 100 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      jest.advanceTimersByTime(100);
      await flush();
      expect(onStartPolling).toHaveBeenCalledTimes(2);
      handle.unsubscribe();
    });
  });

  describe("visual pending", () => {
    it("clears the visual pending flag once a pass completes", async () => {
      const { setVisualPending, handle } = setup({ watchConfig: { initialTimeout: 10 } });
      jest.advanceTimersByTime(10);
      await flush();
      expect(setVisualPending).toHaveBeenLastCalledWith(false);
      handle.unsubscribe();
    });

    it("raises the visual pending flag when a pass outlives the timeout", async () => {
      const walletSyncSdk = makeSdk({ pull: jest.fn(() => new Promise<void>(() => {})) });
      const { setVisualPending, handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10 },
        visualConfig: { visualPendingTimeout: 40 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(setVisualPending).not.toHaveBeenCalledWith(true);

      jest.advanceTimersByTime(40);
      await flush();
      expect(setVisualPending).toHaveBeenCalledWith(true);
      handle.unsubscribe();
    });
  });

  describe("notifications", () => {
    it("does not subscribe when notifications are disabled", () => {
      const { walletSyncSdk, handle } = setup({ watchConfig: {} });
      expect(walletSyncSdk.listenNotifications).not.toHaveBeenCalled();
      handle.unsubscribe();
    });

    it("runs a pass on each notification when enabled", async () => {
      const notifications = makeNotifications();
      const walletSyncSdk = makeSdk({ listenNotifications: jest.fn(() => notifications) });
      const { handle } = setup({
        walletSyncSdk,
        watchConfig: { notificationsEnabled: true, initialTimeout: 10_000 },
      });

      expect(walletSyncSdk.listenNotifications).toHaveBeenCalledWith(trustchain, memberCredentials);
      notifications.emit();
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);
      handle.unsubscribe();
    });

    it("unsubscribes from notifications on unsubscribe", async () => {
      const notifications = makeNotifications();
      const walletSyncSdk = makeSdk({ listenNotifications: jest.fn(() => notifications) });
      const { handle } = setup({
        walletSyncSdk,
        watchConfig: { notificationsEnabled: true, initialTimeout: 10_000 },
      });

      expect(notifications.subscribed).toBe(true);
      handle.unsubscribe();
      expect(notifications.subscribed).toBe(false);
      notifications.emit();
      await flush();
      expect(walletSyncSdk.pull).not.toHaveBeenCalled();
    });
  });

  describe("concurrency", () => {
    it("skips a scheduled pass while the previous one is still running", async () => {
      let resolvePull: () => void = () => {};
      const walletSyncSdk = makeSdk({
        pull: jest.fn(() => new Promise<void>(resolve => (resolvePull = resolve))),
      });
      const { handle } = setup({
        walletSyncSdk,
        watchConfig: { initialTimeout: 10, pollingInterval: 100 },
      });

      jest.advanceTimersByTime(10);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(300);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(1);

      resolvePull();
      await flush();
      jest.advanceTimersByTime(100);
      await flush();
      expect(walletSyncSdk.pull).toHaveBeenCalledTimes(2);
      handle.unsubscribe();
    });
  });
});
