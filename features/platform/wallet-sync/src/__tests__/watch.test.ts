import { selectWalletSyncState, walletSyncUpdate } from "@domain/entity-wallet-sync";
import { resetTrustchainStore, setTrustchain } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { UnknownAction } from "@reduxjs/toolkit";
import { track } from "@shared/analytics";
import { getLkrpSdk } from "../middleware";
import {
  refreshLedgerSync,
  selectLedgerSyncError,
  selectLedgerSyncVisualPending,
  startLedgerSyncWatch,
  stopLedgerSyncWatch,
} from "../watch";
import {
  ACTIVATED,
  applyLocalState,
  blacklist,
  createStore,
  createWalletsync,
  enableWalletSync,
  memberCredentials,
  trustchain,
  WATCH_CONFIG,
} from "./ledgerSyncFixtures";

const mockCloudSyncSdk = {
  push: jest.fn(),
  pull: jest.fn(),
  destroy: jest.fn(),
  listenNotifications: jest.fn(),
};

jest.mock("@shared/cloud-sync", () => ({
  ...jest.requireActual<typeof import("@shared/cloud-sync")>("@shared/cloud-sync"),
  CloudSyncSDK: jest.fn(() => mockCloudSyncSdk),
}));
jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const SYNCED = { ...ACTIVATED, walletSyncState: { data: { value: "distant" }, version: 3 } };

/** createWalletSyncWatchLoop's default, since the watch passes it no visual config. */
const LOOP_VISUAL_PENDING_TIMEOUT = 1000;
jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  getSdk: jest.fn(() => ({ restoreTrustchain: jest.fn() })),
}));

describe("Ledger Sync watch loop", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["setImmediate"] });
    jest.clearAllMocks();
    mockCloudSyncSdk.pull.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should pull once the watch starts while Wallet Sync runs on a trustchain", async () => {
    const store = createStore(ACTIVATED);
    await advance(WATCH_CONFIG.initialTimeout);
    expect(mockCloudSyncSdk.pull).not.toHaveBeenCalled();

    store.dispatch(startLedgerSyncWatch());

    expect(selectLedgerSyncVisualPending(store.getState())).toBe(true);
    await advance(WATCH_CONFIG.initialTimeout);
    expect(mockCloudSyncSdk.pull).toHaveBeenCalledWith(trustchain, memberCredentials);
    expect(selectLedgerSyncVisualPending(store.getState())).toBe(false);
  });

  it("should stay idle while Wallet Sync is disabled, and pull once it gets enabled", async () => {
    const store = startedWatch({ ...ACTIVATED, app: { walletSyncEnabled: false } });
    await advance(WATCH_CONFIG.initialTimeout);

    expect(selectLedgerSyncVisualPending(store.getState())).toBe(false);
    expect(mockCloudSyncSdk.pull).not.toHaveBeenCalled();

    store.dispatch(enableWalletSync(true));
    await advance(WATCH_CONFIG.initialTimeout);

    expect(mockCloudSyncSdk.pull).toHaveBeenCalledTimes(1);
  });

  it.each<[string, UnknownAction]>([
    ["the trustchain is reset", resetTrustchainStore()],
    ["the watch stops", stopLedgerSyncWatch()],
  ])("should stop pulling once %s", async (_, action) => {
    const store = startedWatch();
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(action);
    await advance(WATCH_CONFIG.pollingInterval * 2);

    expect(mockCloudSyncSdk.pull).toHaveBeenCalledTimes(1);
  });

  it("should stop reporting a sync once the watch stops before its first poll", () => {
    const store = startedWatch();

    store.dispatch(stopLedgerSyncWatch());

    expect(selectLedgerSyncVisualPending(store.getState())).toBe(false);
  });

  it("should not report the sync of a loop it stopped while it pulls", async () => {
    mockCloudSyncSdk.pull.mockReturnValueOnce(new Promise(() => {}));
    const store = startedWatch();
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(stopLedgerSyncWatch());
    await advance(LOOP_VISUAL_PENDING_TIMEOUT);

    expect(selectLedgerSyncVisualPending(store.getState())).toBe(false);
  });

  it("should pull again soon after a user refresh", async () => {
    const store = startedWatch();
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(refreshLedgerSync());
    await advance(WATCH_CONFIG.userIntentDebounce);

    expect(mockCloudSyncSdk.pull).toHaveBeenCalledTimes(2);
  });

  it("should restart on the walletsync of a new token blacklist", async () => {
    const store = startedWatch();

    store.dispatch(blacklist(["token"]));
    await advance(WATCH_CONFIG.initialTimeout);

    const [first, second] = createWalletsync.mock.results.map(({ value }) => value);
    expect(createWalletsync.mock.calls).toEqual([[[]], [["token"]]]);
    expect(first.diffLocalToDistant).not.toHaveBeenCalled();
    expect(second.diffLocalToDistant).toHaveBeenCalledTimes(1);
  });

  it("should keep the last error, and clear it when the next poll starts", async () => {
    mockCloudSyncSdk.pull.mockRejectedValueOnce(new Error("network down"));
    const store = startedWatch();

    await advance(WATCH_CONFIG.initialTimeout);
    expect(selectLedgerSyncError(store.getState())).toMatchObject({ message: "network down" });

    await advance(WATCH_CONFIG.pollingInterval);
    expect(selectLedgerSyncError(store.getState())).toBeNull();
  });

  it("should reset Ledger Sync when the trustchain no longer allows this instance", async () => {
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainNotAllowed"));
    const store = startedWatch(SYNCED);

    await advance(WATCH_CONFIG.initialTimeout);

    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(selectWalletSyncState(store.getState())).toEqual({ data: null, version: 0 });
  });

  it("should restore an outdated trustchain", async () => {
    const restored = { ...trustchain, rootId: "restored-root-id" };
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainOutdated"));
    const store = startedWatch();
    jest.mocked(getLkrpSdk(store.dispatch).restoreTrustchain).mockResolvedValue(restored);

    await advance(WATCH_CONFIG.initialTimeout);

    expect(store.getState().trustchain.trustchain).toEqual(restored);
  });

  it("should reset Ledger Sync and report it when the trustchain cannot be restored", async () => {
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainOutdated"));
    const store = startedWatch(SYNCED);
    jest
      .mocked(getLkrpSdk(store.dispatch).restoreTrustchain)
      .mockRejectedValue(errorNamed("TrustchainEjected"));

    await advance(WATCH_CONFIG.initialTimeout);

    expect(store.getState().trustchain.trustchain).toBeNull();
    expect(selectWalletSyncState(store.getState())).toEqual({ data: null, version: 0 });
    expect(track).toHaveBeenCalledWith("ledgersync_deactivated");
  });

  it("should drop a local update that settles after Ledger Sync was reset", async () => {
    const store = startedWatch(SYNCED);
    const { resolveIncrementalUpdate } = createWalletsync.mock.results[0].value;
    let settle!: (resolved: Awaited<ReturnType<typeof resolveIncrementalUpdate>>) => void;
    jest.mocked(resolveIncrementalUpdate).mockReturnValueOnce(
      new Promise(resolve => {
        settle = resolve;
      }),
    );
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(resetTrustchainStore());
    store.dispatch(walletSyncUpdate({ data: null, version: 0 }));
    settle({ hasChanges: true, update: { newValue: "distant" } });
    await advance(0);

    expect(selectWalletSyncState(store.getState())).toEqual({ data: null, version: 0 });
    expect(applyLocalState).not.toHaveBeenCalled();
  });

  it("should drop a restore that settles after the trustchain was reset", async () => {
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainOutdated"));
    const store = startedWatch();
    const restore = pendingRestore(store);
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(resetTrustchainStore());
    restore.resolve({ ...trustchain, rootId: "restored-root-id" });
    await advance(0);

    expect(store.getState().trustchain.trustchain).toBeNull();
  });

  it("should drop a restore that settles after the watch stopped", async () => {
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainOutdated"));
    const store = startedWatch();
    const restore = pendingRestore(store);
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(stopLedgerSyncWatch());
    restore.resolve({ ...trustchain, rootId: "restored-root-id" });
    await advance(0);

    expect(store.getState().trustchain.trustchain).toEqual(trustchain);
  });

  it("should keep a new pairing when a restore of the previous one fails", async () => {
    const paired = { ...trustchain, rootId: "paired-root-id" };
    mockCloudSyncSdk.pull.mockRejectedValueOnce(errorNamed("TrustchainOutdated"));
    const store = startedWatch();
    const restore = pendingRestore(store);
    await advance(WATCH_CONFIG.initialTimeout);

    store.dispatch(setTrustchain(paired));
    restore.reject(errorNamed("TrustchainEjected"));
    await advance(0);

    expect(store.getState().trustchain.trustchain).toEqual(paired);
    expect(track).not.toHaveBeenCalledWith("ledgersync_deactivated");
  });
});

function pendingRestore(store: ReturnType<typeof createStore>) {
  let resolve!: (restored: typeof trustchain) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<typeof trustchain>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  jest.mocked(getLkrpSdk(store.dispatch).restoreTrustchain).mockReturnValue(promise);
  return { resolve, reject };
}

function startedWatch(options: Parameters<typeof createStore>[0] = ACTIVATED) {
  const store = createStore(options);
  store.dispatch(startLedgerSyncWatch());
  return store;
}

function errorNamed(name: string) {
  return Object.assign(new Error(name), { name });
}

/** Advances the fake timers, then lets the loop's promise chain settle. */
async function advance(ms: number) {
  jest.advanceTimersByTime(ms);
  for (let i = 0; i < 5; i++) await new Promise<void>(resolve => setImmediate(resolve));
}
