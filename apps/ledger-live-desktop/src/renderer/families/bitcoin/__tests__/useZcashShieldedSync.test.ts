import { Observable, type Subscription } from "rxjs";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/coin-zcash/constants";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "tests/testSetup";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { upsertShieldedSubscription } from "~/renderer/reducers/shieldedSyncSubscriptions";
import { syncStateUpdater } from "../ZCashExportKeyFlowModal/sync";
import { useZcashShieldedSync } from "../useZcashShieldedSync";

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getAccountBridge: jest.fn(),
}));
jest.mock("../ZCashExportKeyFlowModal/sync", () => ({
  syncStateUpdater: jest.fn(() => ({ type: "test/syncStateUpdater" })),
}));
const mockedGetAccountBridge = jest.mocked(getAccountBridge);
const mockedSyncStateUpdater = jest.mocked(syncStateUpdater);

const baseAccount = createFixtureAccount();

const buildAccount = (overrides: Partial<typeof DEFAULT_ZCASH_PRIVATE_INFO> = {}): ZcashAccount =>
  ({
    ...baseAccount,
    currency: { id: "zcash" } as CryptoCurrency,
    privateInfo: {
      ...DEFAULT_ZCASH_PRIVATE_INFO,
      ufvk: "test-ufvk",
      syncState: "ready",
      ...overrides,
    },
  }) as unknown as ZcashAccount;

describe("useZcashShieldedSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("starts a shielded sync when no subscription is tracked for the account (unchanged behavior)", async () => {
    const account = buildAccount();
    const syncMock = jest.fn(
      () =>
        new Observable<(a: unknown) => unknown>(subscriber => {
          subscriber.next(a => a);
        }),
    );
    mockedGetAccountBridge.mockReturnValue({
      sync: syncMock,
    } as unknown as ReturnType<typeof getAccountBridge>);

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { shieldedSyncSubscriptions: [] },
    });

    act(() => {
      result.current.startShieldedSync();
    });

    expect(mockedGetAccountBridge).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
    );
    // getAccountBridge resolves through a Promise before bridge.sync is called,
    // so let that microtask settle before asserting on it.
    await waitFor(() => {
      expect(syncMock).toHaveBeenCalledWith(expect.objectContaining({ id: account.id }), {
        paginationConfig: {},
        syncType: SYNC_TYPE_SHIELDED,
      });
    });
    expect(mockedSyncStateUpdater).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
      { syncState: "running", progress: 0, lastSyncError: null },
    );
    expect(store.getState().shieldedSyncSubscriptions).toEqual([
      {
        accountId: account.id,
        subscription: expect.objectContaining({ unsubscribe: expect.any(Function) }),
      },
    ]);
  });

  it("is a no-op when a sync is already in flight for the account", () => {
    const account = buildAccount();
    const existingUnsubscribe = jest.fn();
    const existingSubscription = {
      accountId: account.id,
      subscription: { unsubscribe: existingUnsubscribe },
    };

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { shieldedSyncSubscriptions: [existingSubscription] },
    });

    act(() => {
      result.current.startShieldedSync();
    });

    // Neither the bridge nor a new subscription/state dispatch fire, and the
    // in-flight subscription is left running, not cancelled.
    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(mockedSyncStateUpdater).not.toHaveBeenCalled();
    expect(existingUnsubscribe).not.toHaveBeenCalled();
    expect(store.getState().shieldedSyncSubscriptions).toEqual([existingSubscription]);
  });

  it("is a no-op when the account's own syncState is already running, even with no tracked subscription", () => {
    const account = buildAccount({ syncState: "running" });

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { shieldedSyncSubscriptions: [] },
    });

    act(() => {
      result.current.startShieldedSync();
    });

    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(mockedSyncStateUpdater).not.toHaveBeenCalled();
    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
  });

  it("does not report a stopped state when there is no tracked subscription to actually stop", () => {
    const account = buildAccount({ syncState: "running" });

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { shieldedSyncSubscriptions: [] },
    });

    act(() => {
      result.current.stopShieldedSync();
    });

    expect(mockedSyncStateUpdater).not.toHaveBeenCalled();
    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
  });

  it("does not start a duplicate sync when the account started running via a store update the hook was never re-rendered for", () => {
    const account = buildAccount();

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { accounts: [account], shieldedSyncSubscriptions: [] },
    });

    store.dispatch(
      updateAccountWithUpdater(account.id, existing => {
        const zcashExisting = existing as ZcashAccount;
        return {
          ...zcashExisting,
          privateInfo: { ...zcashExisting.privateInfo, syncState: "running" },
        };
      }),
    );

    act(() => {
      result.current.startShieldedSync();
    });

    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(mockedSyncStateUpdater).not.toHaveBeenCalled();
  });

  it("does not start a duplicate sync when a subscription was tracked via a store update the hook was never re-rendered for", () => {
    const account = buildAccount();
    const unsubscribe = jest.fn();

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: { accounts: [account], shieldedSyncSubscriptions: [] },
    });

    store.dispatch(
      upsertShieldedSubscription({
        accountId: account.id,
        subscription: { unsubscribe } as unknown as Subscription,
      }),
    );

    act(() => {
      result.current.startShieldedSync();
    });

    expect(mockedGetAccountBridge).not.toHaveBeenCalled();
    expect(mockedSyncStateUpdater).not.toHaveBeenCalled();
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it("stops a shielded sync and clears its tracked subscription regardless of the re-entrancy guard", () => {
    const account = buildAccount({ syncState: "running" });
    const unsubscribe = jest.fn();

    const { result, store } = renderHook(() => useZcashShieldedSync(account), {
      initialState: {
        shieldedSyncSubscriptions: [{ accountId: account.id, subscription: { unsubscribe } }],
      },
    });

    act(() => {
      result.current.stopShieldedSync();
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(mockedSyncStateUpdater).toHaveBeenCalledWith(
      expect.objectContaining({ id: account.id }),
      { syncState: "stopped", progress: 0 },
    );
    expect(store.getState().shieldedSyncSubscriptions).toEqual([]);
  });
});
