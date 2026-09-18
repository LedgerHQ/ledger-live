import { configureStore } from "@reduxjs/toolkit";
import {
  importWalletSyncState,
  reconcileWalletSyncState,
  setWalletSyncStateHydrated,
  walletSyncSlice,
  walletSyncUpdate,
} from "./slice";

function makeStore() {
  const store = configureStore({ reducer: { walletSync: walletSyncSlice.reducer } });
  return {
    dispatch: store.dispatch,
    state: () => store.getState().walletSync,
    ws: () => store.getState().walletSync.walletSyncState,
  };
}

describe("walletSyncSlice", () => {
  it("starts unhydrated with no data and version 0", () => {
    expect(makeStore().state()).toEqual({
      walletSyncState: { data: null, version: 0 },
      isHydrated: false,
    });
  });

  it("imports and marks a persisted cursor as hydrated", () => {
    const store = makeStore();
    const cursor = { data: { accounts: [] }, version: 3, environment: "STAGING" as const };

    store.dispatch(importWalletSyncState(cursor));

    expect(store.state()).toEqual({ walletSyncState: cursor, isHydrated: true });
  });

  it("marks a missing persisted cursor as hydrated", () => {
    const store = makeStore();

    store.dispatch(setWalletSyncStateHydrated());

    expect(store.state()).toEqual({
      walletSyncState: { data: null, version: 0 },
      isHydrated: true,
    });
  });

  it("does not reconcile before hydration", () => {
    const store = makeStore();
    const before = store.state();

    store.dispatch(reconcileWalletSyncState("STAGING"));

    expect(store.state()).toBe(before);
  });

  it("preserves and tags a legacy cursor on PROD", () => {
    const store = makeStore();
    store.dispatch(importWalletSyncState({ data: { accounts: [] }, version: 3 }));

    store.dispatch(reconcileWalletSyncState("PROD"));

    expect(store.ws()).toEqual({ data: { accounts: [] }, version: 3, environment: "PROD" });
  });

  it("preserves and tags a legacy cursor on STAGING", () => {
    const store = makeStore();
    store.dispatch(importWalletSyncState({ data: { accounts: [] }, version: 3 }));

    store.dispatch(reconcileWalletSyncState("STAGING"));

    expect(store.ws()).toEqual({ data: { accounts: [] }, version: 3, environment: "STAGING" });
  });

  it("preserves a cursor whose environment matches", () => {
    const store = makeStore();
    const cursor = { data: { accounts: [] }, version: 3, environment: "STAGING" as const };
    store.dispatch(importWalletSyncState(cursor));
    const before = store.state();

    store.dispatch(reconcileWalletSyncState("STAGING"));

    expect(store.state()).toBe(before);
  });

  it("resets a cursor whose environment differs", () => {
    const store = makeStore();
    store.dispatch(
      importWalletSyncState({ data: { accounts: [] }, version: 3, environment: "STAGING" }),
    );

    store.dispatch(reconcileWalletSyncState("PROD"));

    expect(store.ws()).toEqual({ data: null, version: 0, environment: "PROD" });
  });

  it("walletSyncUpdate preserves cursor provenance and hydration", () => {
    const store = makeStore();
    store.dispatch(importWalletSyncState({ data: null, version: 0, environment: "STAGING" }));

    store.dispatch(walletSyncUpdate({ data: { accounts: [] }, version: 3 }));

    expect(store.state()).toEqual({
      walletSyncState: { data: { accounts: [] }, version: 3, environment: "STAGING" },
      isHydrated: true,
    });
  });

  it("walletSyncUpdate resets data back to null", () => {
    const store = makeStore();
    store.dispatch(walletSyncUpdate({ data: { accounts: [] }, version: 3 }));
    store.dispatch(walletSyncUpdate({ data: null, version: 0 }));
    expect(store.ws()).toEqual({ data: null, version: 0 });
  });
});
