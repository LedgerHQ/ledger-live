/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import React from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { setCountervaluesState } from "@domain/entity-market-countervalues";
import {
  countervaluesReducer,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesStateError,
  setCountervaluesStatePending,
} from "@features/platform-market-countervalues";
import { useSyncSources, type WalletSyncUserState } from "../useSyncSources";
import * as context from "../context";
import * as globalSyncStateModule from "../useGlobalSyncState";

// The countervalues hooks run for real on a store; only the other two sync sources are stubbed.

jest.mock("../context", () => ({
  useBridgeSync: jest.fn(),
}));

jest.mock("../useGlobalSyncState", () => ({
  useGlobalSyncState: jest.fn(),
}));

const walletSync: WalletSyncUserState = {
  onUserRefresh: jest.fn(),
  visualPending: false,
  walletSyncError: null,
};

function renderOnStore() {
  const store = configureStore({
    reducer: { countervalues: countervaluesReducer },
    // The state holds an Error and rate Maps.
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  let renders = 0;
  const { result } = renderHook(
    () => {
      renders++;
      return useSyncSources(walletSync);
    },
    {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      ),
    },
  );
  return { store, result, renders: () => renders };
}

describe("useSyncSources on a countervalues store", () => {
  beforeEach(() => {
    jest.mocked(context.useBridgeSync).mockReturnValue(jest.fn());
    jest.mocked(globalSyncStateModule.useGlobalSyncState).mockReturnValue({
      pending: false,
      error: null,
    });
  });

  it("follows a load that fails, then one that succeeds", () => {
    const { store, result } = renderOnStore();
    expect(result.current).toMatchObject({ isPending: false, cvPending: false });

    act(() => {
      store.dispatch(setCountervaluesStatePending(true));
    });
    expect(result.current).toMatchObject({ isPending: true, cvPending: true });
    expect(result.current.hasCvOrBridgeError).toBe(false);

    act(() => {
      store.dispatch(setCountervaluesStateError(new Error("countervalues down")));
    });
    expect(result.current).toMatchObject({ isPending: false, cvPending: false });
    expect(result.current.hasCvOrBridgeError).toBe(true);

    act(() => {
      store.dispatch(setCountervaluesStatePending(true));
      store.dispatch(setCountervaluesStatePending(false));
    });
    expect(result.current.hasCvOrBridgeError).toBe(false);
  });

  it("does not re-render for new rates, the polling flags or an unrelated action", () => {
    const { store, renders } = renderOnStore();
    const mounted = renders();

    act(() => {
      store.dispatch(setCountervaluesPollingTriggerLoad(true));
      store.dispatch(setCountervaluesPollingIsPolling(false));
      store.dispatch(setCountervaluesState({ data: {}, status: {}, cache: {} }));
      store.dispatch({ type: "UNRELATED" });
    });
    expect(renders()).toBe(mounted);

    act(() => {
      store.dispatch(setCountervaluesStatePending(true));
    });
    expect(renders()).toBeGreaterThan(mounted);
  });
});
