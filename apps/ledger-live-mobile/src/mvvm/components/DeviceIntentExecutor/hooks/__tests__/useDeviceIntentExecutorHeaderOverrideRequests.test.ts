import { act, renderHook } from "@tests/test-renderer";
import { useDeviceIntentExecutorHeaderOverrideRequests } from "../useDeviceIntentExecutorHeaderOverrideRequests";

describe("useDeviceIntentExecutorHeaderOverrideRequests", () => {
  it("GIVEN the hook has just rendered WHEN no request has been made THEN there is no header override", () => {
    // GIVEN
    const { result } = renderHook(() => useDeviceIntentExecutorHeaderOverrideRequests());

    // WHEN
    // (no action)

    // THEN
    expect(result.current.hasHeaderOverride).toBe(false);
  });

  it("GIVEN the hook has just rendered WHEN a component requests a header override THEN it becomes active", () => {
    // GIVEN
    const { result } = renderHook(() => useDeviceIntentExecutorHeaderOverrideRequests());

    // WHEN
    act(() => {
      result.current.headerContextValue.requestHeaderOverride();
    });

    // THEN
    expect(result.current.hasHeaderOverride).toBe(true);
  });

  it("GIVEN two header overrides have been requested WHEN the older request is cleaned up first THEN the override remains active", () => {
    // GIVEN
    const { result } = renderHook(() => useDeviceIntentExecutorHeaderOverrideRequests());
    let cleanupFirst: (() => void) | undefined;
    act(() => {
      cleanupFirst = result.current.headerContextValue.requestHeaderOverride();
    });
    act(() => {
      result.current.headerContextValue.requestHeaderOverride();
    });
    expect(result.current.hasHeaderOverride).toBe(true);

    // WHEN
    act(() => {
      cleanupFirst?.();
    });

    // THEN
    expect(result.current.hasHeaderOverride).toBe(true);
  });

  it("GIVEN a header override has been requested WHEN its cleanup runs THEN the override becomes inactive", () => {
    // GIVEN
    const { result } = renderHook(() => useDeviceIntentExecutorHeaderOverrideRequests());
    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.headerContextValue.requestHeaderOverride();
    });
    expect(result.current.hasHeaderOverride).toBe(true);

    // WHEN
    act(() => {
      cleanup?.();
    });

    // THEN
    expect(result.current.hasHeaderOverride).toBe(false);
  });
});
