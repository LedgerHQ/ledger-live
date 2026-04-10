import { act } from "react";
import { renderHook } from "tests/testSetup";
import { isPrivateSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";
import { useIsPrivateSyncPending } from "./useIsPrivateSyncPending";

describe("useIsPrivateSyncPending", () => {
  beforeEach(() => {
    isPrivateSyncPending$.next(false);
  });

  it("should return false when no private sync is running", () => {
    const { result } = renderHook(() => useIsPrivateSyncPending());

    expect(result.current).toBe(false);
  });

  it("should return true when isPrivateSyncPending$ emits true", () => {
    const { result } = renderHook(() => useIsPrivateSyncPending());

    act(() => {
      isPrivateSyncPending$.next(true);
    });

    expect(result.current).toBe(true);
  });

  it("should return false again when isPrivateSyncPending$ emits false after true", () => {
    const { result } = renderHook(() => useIsPrivateSyncPending());

    act(() => {
      isPrivateSyncPending$.next(true);
    });

    act(() => {
      isPrivateSyncPending$.next(false);
    });

    expect(result.current).toBe(false);
  });

  it("should unsubscribe from isPrivateSyncPending$ on unmount", () => {
    const spy = jest.spyOn(isPrivateSyncPending$, "subscribe");
    const { unmount } = renderHook(() => useIsPrivateSyncPending());

    expect(spy).toHaveBeenCalledTimes(1);
    const subscription = spy.mock.results[0].value;
    const unsubscribeSpy = jest.spyOn(subscription, "unsubscribe");

    unmount();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should reflect the current value of isPrivateSyncPending$ at mount time", () => {
    isPrivateSyncPending$.next(true);

    const { result } = renderHook(() => useIsPrivateSyncPending());

    expect(result.current).toBe(true);
  });
});
