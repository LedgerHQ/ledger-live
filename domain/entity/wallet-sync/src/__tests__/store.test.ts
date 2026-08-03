import { configureStore } from "@reduxjs/toolkit";
import { walletSyncSlice, walletSyncUpdate } from "../slice";
import { walletSyncStateSelector } from "../selectors";

function makeStore() {
  const store = configureStore({ reducer: { walletSync: walletSyncSlice.reducer } });
  return {
    dispatch: store.dispatch,
    ws: () => walletSyncStateSelector(store.getState().walletSync),
  };
}

describe("walletSyncSlice", () => {
  it("starts with no data and version 0", () => {
    expect(makeStore().ws()).toEqual({ data: null, version: 0 });
  });

  it("walletSyncUpdate sets both data and version", () => {
    const store = makeStore();
    store.dispatch(walletSyncUpdate({ data: { accounts: [] }, version: 3 }));
    expect(store.ws()).toEqual({ data: { accounts: [] }, version: 3 });
  });

  it("walletSyncUpdate resets data back to null", () => {
    const store = makeStore();
    store.dispatch(walletSyncUpdate({ data: { accounts: [] }, version: 3 }));
    store.dispatch(walletSyncUpdate({ data: null, version: 0 }));
    expect(store.ws()).toEqual({ data: null, version: 0 });
  });
});
