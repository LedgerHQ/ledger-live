/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { Provider } from "react-redux";
import { useWalletSyncUserState, useLedgerSyncWatch } from "../hooks";
import { refreshLedgerSync, selectLedgerSyncVisualPending } from "../watch";
import { ACTIVATED, createStore } from "./ledgerSyncFixtures";

jest.mock("@shared/cloud-sync", () => ({
  ...jest.requireActual<typeof import("@shared/cloud-sync")>("@shared/cloud-sync"),
  CloudSyncSDK: jest.fn(() => ({})),
}));
jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({ getSdk: jest.fn(() => ({})) }));

describe("Ledger Sync hooks", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should run the watch while the caller is mounted", () => {
    const store = createStore(ACTIVATED);
    const { unmount } = renderHook(() => useLedgerSyncWatch(), { wrapper: withStore(store) });
    expect(selectLedgerSyncVisualPending(store.getState())).toBe(true);

    unmount();

    expect(selectLedgerSyncVisualPending(store.getState())).toBe(false);
  });

  it("should show the watch state, and ask the watch for an early sync on a user refresh", () => {
    const store = createStore(ACTIVATED);
    const dispatch = jest.spyOn(store, "dispatch");
    const { result } = renderHook(() => useWalletSyncUserState(), { wrapper: withStore(store) });
    expect(result.current).toMatchObject({ visualPending: false, walletSyncError: null });

    act(() => result.current.onUserRefresh());

    expect(dispatch).toHaveBeenCalledWith(refreshLedgerSync());
  });
});

function withStore(store: ReturnType<typeof createStore>) {
  return ({ children }: Readonly<{ children: ReactNode }>) => (
    <Provider store={store}>{children}</Provider>
  );
}
