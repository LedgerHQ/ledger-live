import { act } from "react";
import { renderHook } from "tests/testSetup";
import { isCombinedSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";
import { useIsCombinedSyncPending } from "./useIsCombinedSyncPending";

describe("useIsCombinedSyncPending", () => {
  beforeEach(() => {
    isCombinedSyncPending$.next(false);
  });

  it("should return false when no combined sync is running", () => {
    const { result } = renderHook(() => useIsCombinedSyncPending());

    expect(result.current).toBe(false);
  });

  it("should return true when isCombinedSyncPending$ emits true", () => {
    const { result } = renderHook(() => useIsCombinedSyncPending());

    act(() => {
      isCombinedSyncPending$.next(true);
    });

    expect(result.current).toBe(true);
  });

  it("should return false again when isCombinedSyncPending$ emits false after true", () => {
    const { result } = renderHook(() => useIsCombinedSyncPending());

    act(() => {
      isCombinedSyncPending$.next(true);
    });

    act(() => {
      isCombinedSyncPending$.next(false);
    });

    expect(result.current).toBe(false);
  });

  it("should unsubscribe from isCombinedSyncPending$ on unmount", () => {
    const spy = jest.spyOn(isCombinedSyncPending$, "subscribe");
    const { unmount } = renderHook(() => useIsCombinedSyncPending());

    expect(spy).toHaveBeenCalledTimes(1);
    const subscription = spy.mock.results[0].value;
    const unsubscribeSpy = jest.spyOn(subscription, "unsubscribe");

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should reflect the current value of isCombinedSyncPending$ at mount time", () => {
    isCombinedSyncPending$.next(true);

    const { result } = renderHook(() => useIsCombinedSyncPending());

    expect(result.current).toBe(true);
  });
});
