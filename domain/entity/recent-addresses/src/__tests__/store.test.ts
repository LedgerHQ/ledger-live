import { configureStore } from "@reduxjs/toolkit";
import { recentAddressesSlice, updateRecentAddresses } from "../slice";
import type { RecentAddressesState } from "../schema";

function makeStore() {
  return configureStore({ reducer: { recentAddresses: recentAddressesSlice.reducer } });
}

describe("recentAddressesSlice", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(store.getState().recentAddresses).toEqual({});
  });

  it("updateRecentAddresses replaces state", () => {
    const store = makeStore();
    const payload: RecentAddressesState = {
      bitcoin: [{ address: "bc1q...", lastUsed: 1000 }],
    };
    store.dispatch(updateRecentAddresses(payload));
    expect(store.getState().recentAddresses).toEqual(payload);
  });

  it("handles multiple currencies", () => {
    const store = makeStore();
    const payload: RecentAddressesState = {
      ethereum: [{ address: "0x123", lastUsed: 2000 }],
      bitcoin: [
        { address: "bc1a...", lastUsed: 1000 },
        { address: "bc1b...", lastUsed: 1500 },
      ],
    };
    store.dispatch(updateRecentAddresses(payload));
    expect(store.getState().recentAddresses).toEqual(payload);
  });

  it("replaces previous state (not merge)", () => {
    const store = makeStore();
    store.dispatch(updateRecentAddresses({ bitcoin: [{ address: "bc1q...", lastUsed: 1000 }] }));
    store.dispatch(updateRecentAddresses({ ethereum: [{ address: "0x123", lastUsed: 2000 }] }));
    expect(store.getState().recentAddresses).toEqual({
      ethereum: [{ address: "0x123", lastUsed: 2000 }],
    });
  });
});
