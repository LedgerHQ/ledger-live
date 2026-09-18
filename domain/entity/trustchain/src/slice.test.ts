import { configureStore } from "@reduxjs/toolkit";
import { makeTrustchain, makeTrustchainMemberKey, makeTrustchainState } from "./schema.mock";
import {
  importTrustchainState,
  resetTrustchainState,
  setMemberKey,
  setTrustchain,
  trustchainSlice,
} from "./slice";
import { memberKeySelector, trustchainSelector, trustchainStateSelector } from "./selectors";

function makeStore(preloadedState = trustchainSlice.getInitialState()) {
  return configureStore({
    reducer: { trustchain: trustchainSlice.reducer },
    preloadedState: { trustchain: preloadedState },
  });
}

describe("trustchainSlice", () => {
  it("starts empty", () => {
    const store = makeStore();
    expect(trustchainStateSelector(store.getState())).toEqual({
      trustchain: null,
      memberKey: null,
    });
  });

  it("imports, updates and resets persisted instance state", () => {
    const store = makeStore();
    const populated = makeTrustchainState();
    store.dispatch(importTrustchainState(populated));
    expect(trustchainSelector(store.getState())).toEqual(populated.trustchain);

    const nextTrustchain = makeTrustchain({ rootId: "next" });
    store.dispatch(setTrustchain(nextTrustchain));
    expect(trustchainSelector(store.getState())).toEqual(nextTrustchain);

    const nextKey = makeTrustchainMemberKey({ id: "next-key" });
    store.dispatch(setMemberKey(nextKey));
    expect(memberKeySelector(store.getState())).toEqual(nextKey);

    store.dispatch(resetTrustchainState());
    expect(trustchainStateSelector(store.getState())).toEqual({
      trustchain: null,
      memberKey: null,
    });
  });
});
