import { act } from "react";
import { renderHook } from "tests/testSetup";
import { isBackgroundSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";
import { useIsBackgroundSyncPending } from "./useIsBackgroundSyncPending";

describe("useIsBackgroundSyncPending", () => {
  beforeEach(() => {
    isBackgroundSyncPending$.next(false);
  });

  it("should return false when no background sync is running", () => {
    const { result } = renderHook(() => useIsBackgroundSyncPending());

    expect(result.current).toBe(false);
  });

  it("should return true when isBackgroundSyncPending$ emits true", () => {
    const { result } = renderHook(() => useIsBackgroundSyncPending());

    act(() => {
      isBackgroundSyncPending$.next(true);
    });

    expect(result.current).toBe(true);
  });

  it("should return false again when isBackgroundSyncPending$ emits false after true", () => {
    const { result } = renderHook(() => useIsBackgroundSyncPending());

    act(() => {
      isBackgroundSyncPending$.next(true);
    });

    act(() => {
      isBackgroundSyncPending$.next(false);
    });

    expect(result.current).toBe(false);
  });

  it("should unsubscribe from isBackgroundSyncPending$ on unmount", () => {
    const spy = jest.spyOn(isBackgroundSyncPending$, "subscribe");
    const { unmount } = renderHook(() => useIsBackgroundSyncPending());

    expect(spy).toHaveBeenCalledTimes(1);
    const subscription = spy.mock.results[0].value;
    const unsubscribeSpy = jest.spyOn(subscription, "unsubscribe");

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should reflect the current value of isBackgroundSyncPending$ at mount time", () => {
    isBackgroundSyncPending$.next(true);

    const { result } = renderHook(() => useIsBackgroundSyncPending());

    expect(result.current).toBe(true);
  });
});
