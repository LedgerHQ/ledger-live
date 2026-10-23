import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { SyncState } from "@ledgerhq/live-common/bridge/react/types";
import { useNetworkState } from "@shared/network-status";
import { countervaluesSyncSlice } from "@features/platform-market-countervalues";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { updateAccount } from "~/actions/accounts";
import { SYNC_SETTLE_GUARD_MS } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import AccountScreen from "../AccountScreen";
import { ACCOUNT_DETAIL_TEST_IDS } from "../testIds";
import type { Account } from "@ledgerhq/types-live";

const mockSetSyncBehavior = jest.fn();
const mockSyncState = {
  current: { pending: false, error: null } as SyncState,
  listeners: new Set<() => void>(),
};

jest.mock("@ledgerhq/live-common/bridge/react/index", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/bridge/react/index");
  const { useSyncExternalStore } = jest.requireActual<typeof React>("react");
  const subscribe = (listener: () => void) => {
    mockSyncState.listeners.add(listener);
    return () => mockSyncState.listeners.delete(listener);
  };
  return {
    ...actual,
    useBridgeSync: () => mockSetSyncBehavior,
    useAccountSyncState: () => useSyncExternalStore(subscribe, () => mockSyncState.current),
  };
});

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

function setSyncState(next: SyncState) {
  act(() => {
    mockSyncState.current = next;
    mockSyncState.listeners.forEach(listener => listener());
  });
}

const STABLE_PENDING_DELAY_MS = 200;

const account = genAccount("account-detail-refresh-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  operationsSize: 2,
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

function renderAccount() {
  return render(
    <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenName.Account}
        component={AccountScreen}
        initialParams={{ accountId: account.id }}
      />
    </Stack.Navigator>,
    {
      overrideInitialState: (state: State): State => {
        const withFlag = withFlagOverrides({ accountDetail: { enabled: true } })(state);
        return { ...withFlag, accounts: { ...withFlag.accounts, active: [account] } };
      },
    },
  );
}

function pullToRefresh() {
  const scrollView = screen.getByTestId(ACCOUNT_DETAIL_TEST_IDS.scrollView);
  act(() => scrollView.props.refreshControl.props.onRefresh());
}

function finishSync(error: Error | null = null) {
  setSyncState({ pending: true, error: null });
  setSyncState({ pending: false, error });
  act(() => jest.advanceTimersByTime(STABLE_PENDING_DELAY_MS));
}

const status = (suffix: string) => `${ACCOUNT_DETAIL_TEST_IDS.refreshStatus}-${suffix}`;

describe("AccountDetail pull-to-refresh", () => {
  beforeEach(() => {
    mockSetSyncBehavior.mockClear();
    mockSyncState.current = { pending: false, error: null };
  });

  it("syncs only this account and shows the refresh status until it's up to date", () => {
    const { store } = renderAccount();
    expect(screen.queryByTestId(status("refreshing"))).toBeNull();

    pullToRefresh();

    expect(mockSetSyncBehavior).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SYNC_ONE_ACCOUNT", accountId: account.id }),
    );
    expect(screen.getByTestId(status("refreshing"))).toHaveTextContent("Refreshing...");

    finishSync();
    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));

    expect(screen.getByTestId(status("up-to-date"))).toHaveTextContent("Account up to date");
    expect(screen.queryByTestId(status("refreshing"))).toBeNull();
    expect(store.getState().portfolioRefresh.lastUserSyncClickTimestamp).toBe(0);
  });

  it("shows the sync error when the account fails to sync", () => {
    renderAccount();

    pullToRefresh();
    finishSync(new Error("sync failed"));

    expect(screen.getByTestId(status("error"))).toHaveTextContent("Account data couldn’t load");
  });

  it("shows the sync error when the sync fails before it starts", () => {
    renderAccount();

    pullToRefresh();
    setSyncState({ pending: false, error: new Error("bridge failed to load") });

    expect(screen.getByTestId(status("error"))).toHaveTextContent("Account data couldn’t load");
    expect(screen.queryByTestId(status("refreshing"))).toBeNull();
  });

  it("shows the sync error when the account is no longer up to date after the sync, like the Portfolio", () => {
    const { store } = renderAccount();

    pullToRefresh();
    setSyncState({ pending: true, error: null });
    act(() => {
      store.dispatch(updateAccount({ id: account.id, lastSyncDate: new Date(0) }));
    });
    setSyncState({ pending: false, error: null });
    act(() => jest.advanceTimersByTime(STABLE_PENDING_DELAY_MS));

    expect(screen.getByTestId(status("error"))).toHaveTextContent("Account data couldn’t load");
  });

  it("waits for the countervalues and shows their failure, like the Portfolio", () => {
    const { store } = renderAccount();

    pullToRefresh();
    act(() => {
      store.dispatch(countervaluesSyncSlice.actions.loadStarted());
    });
    finishSync();
    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));

    expect(screen.getByTestId(status("refreshing"))).toHaveTextContent("Refreshing...");

    act(() => {
      store.dispatch(countervaluesSyncSlice.actions.loadFailed(new Error("rates failed")));
    });
    act(() => jest.advanceTimersByTime(STABLE_PENDING_DELAY_MS));

    expect(screen.getByTestId(status("error"))).toHaveTextContent("Account data couldn’t load");
  });

  it("keeps refreshing when the account already had an error before the pull", () => {
    mockSyncState.current = { pending: false, error: new Error("previous sync failed") };
    renderAccount();

    pullToRefresh();
    act(() => jest.advanceTimersByTime(SYNC_SETTLE_GUARD_MS));

    expect(screen.getByTestId(status("refreshing"))).toHaveTextContent("Refreshing...");
  });

  it("shows the offline message without syncing when offline", () => {
    jest.mocked(useNetworkState).mockReturnValue({ isConnected: false });
    const { store } = renderAccount();

    pullToRefresh();

    expect(mockSetSyncBehavior).not.toHaveBeenCalled();
    expect(screen.getByTestId(status("offline"))).toHaveTextContent(/offline/i);
    expect(store.getState().portfolioRefresh.lastOfflineRefreshAttemptTimestamp).toBe(0);
  });

  it("ignores a second pull while the first one is in progress", () => {
    renderAccount();

    pullToRefresh();
    pullToRefresh();

    expect(mockSetSyncBehavior).toHaveBeenCalledTimes(1);
  });
});
