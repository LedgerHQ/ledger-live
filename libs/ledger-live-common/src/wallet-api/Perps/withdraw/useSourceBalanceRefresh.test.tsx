/**
 * @jest-environment jsdom
 */
import "../../../__tests__/test-helpers/dom-polyfill";
import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { BridgeSyncContext, BridgeSyncStateContext } from "../../../bridge/react/context";
import type { BridgeSyncState } from "../../../bridge/react/types";
import {
  SOURCE_BALANCE_REFRESH_TIMEOUT_MS,
  useSourceBalanceRefresh,
} from "./useSourceBalanceRefresh";

const ACCOUNT_ID = "hypercore-1";

function renderRefresh(initialSyncState: BridgeSyncState = {}) {
  const sync = jest.fn();
  let syncState = initialSyncState;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <BridgeSyncContext.Provider value={sync}>
      <BridgeSyncStateContext.Provider value={syncState}>
        {children}
      </BridgeSyncStateContext.Provider>
    </BridgeSyncContext.Provider>
  );
  const hook = renderHook(() => useSourceBalanceRefresh(ACCOUNT_ID), { wrapper });
  const setPending = (pending: boolean) => {
    syncState = { [ACCOUNT_ID]: { pending, error: null } };
    hook.rerender();
  };
  return { ...hook, sync, setPending };
}

describe("useSourceBalanceRefresh", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("syncs the HyperCore account when the form opens", () => {
    const { sync } = renderRefresh();

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      accountId: ACCOUNT_ID,
      priority: 10,
      reason: "perps-withdraw-form",
    });
  });

  it("is refreshing until that sync is done", () => {
    const { result, setPending } = renderRefresh();
    expect(result.current).toBe(true);

    setPending(true);
    expect(result.current).toBe(true);

    setPending(false);
    expect(result.current).toBe(false);
  });

  it("waits for a sync already running when the form opens", () => {
    const { result, setPending } = renderRefresh({
      [ACCOUNT_ID]: { pending: true, error: null },
    });
    expect(result.current).toBe(true);

    setPending(false);
    expect(result.current).toBe(false);
  });

  it("stops refreshing after the timeout when the sync never starts", () => {
    const { result } = renderRefresh();

    act(() => jest.advanceTimersByTime(SOURCE_BALANCE_REFRESH_TIMEOUT_MS - 1));
    expect(result.current).toBe(true);

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(false);
  });

  it("stays done when a later sync starts", () => {
    const { result, setPending } = renderRefresh();
    setPending(true);
    setPending(false);

    setPending(true);
    expect(result.current).toBe(false);
  });
});
