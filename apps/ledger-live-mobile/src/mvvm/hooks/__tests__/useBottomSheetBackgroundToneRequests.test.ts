import { act, renderHook } from "@tests/test-renderer";
import { useBottomSheetBackgroundToneRequests } from "../useBottomSheetBackgroundToneRequests";

describe("useBottomSheetBackgroundToneRequests", () => {
  it("GIVEN the hook has just rendered WHEN no request has been made THEN the background tone is undefined", () => {
    // GIVEN
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());

    // WHEN
    // (no action)

    // THEN
    expect(result.current.backgroundTone).toBeUndefined();
  });

  it("GIVEN the hook has just rendered WHEN a component requests a tone THEN it becomes the active background tone", () => {
    // GIVEN
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());

    // WHEN
    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("success");
    });

    // THEN
    expect(result.current.backgroundTone).toBe("success");
  });

  it("GIVEN two tones have been requested in order WHEN their requests are cleaned up in LIFO order THEN each cleanup restores the previous tone", () => {
    // GIVEN
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());
    let cleanupSuccess: (() => void) | undefined;
    let cleanupError: (() => void) | undefined;
    act(() => {
      cleanupSuccess = result.current.backgroundContextValue.requestBackgroundTone("success");
    });
    act(() => {
      cleanupError = result.current.backgroundContextValue.requestBackgroundTone("error");
    });
    expect(result.current.backgroundTone).toBe("error");

    // WHEN
    act(() => {
      cleanupError?.();
    });

    // THEN
    expect(result.current.backgroundTone).toBe("success");

    // WHEN
    act(() => {
      cleanupSuccess?.();
    });

    // THEN
    expect(result.current.backgroundTone).toBeUndefined();
  });

  it("GIVEN two tones have been requested in order WHEN the older request is cleaned up first THEN the latest tone remains active", () => {
    // GIVEN
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());
    let cleanupSuccess: (() => void) | undefined;
    act(() => {
      cleanupSuccess = result.current.backgroundContextValue.requestBackgroundTone("success");
    });
    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("error");
    });
    expect(result.current.backgroundTone).toBe("error");

    // WHEN
    act(() => {
      cleanupSuccess?.();
    });

    // THEN
    expect(result.current.backgroundTone).toBe("error");
  });

  it("GIVEN two requesters have requested the same tone WHEN one of them is cleaned up THEN the tone remains active", () => {
    // GIVEN
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());
    let cleanupFirst: (() => void) | undefined;
    act(() => {
      cleanupFirst = result.current.backgroundContextValue.requestBackgroundTone("success");
    });
    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("success");
    });
    expect(result.current.backgroundTone).toBe("success");

    // WHEN
    act(() => {
      cleanupFirst?.();
    });

    // THEN
    expect(result.current.backgroundTone).toBe("success");
  });

  it("GIVEN the hook has rendered WHEN it re-renders or a request is made THEN backgroundContextValue keeps a stable identity", () => {
    // GIVEN
    const { result, rerender } = renderHook(() => useBottomSheetBackgroundToneRequests());
    const initialContextValue = result.current.backgroundContextValue;
    const initialRequestBackgroundTone =
      result.current.backgroundContextValue.requestBackgroundTone;

    // WHEN
    rerender(undefined);

    // THEN
    expect(result.current.backgroundContextValue).toBe(initialContextValue);
    expect(result.current.backgroundContextValue.requestBackgroundTone).toBe(
      initialRequestBackgroundTone,
    );

    // WHEN
    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("info");
    });

    // THEN
    expect(result.current.backgroundContextValue).toBe(initialContextValue);
    expect(result.current.backgroundContextValue.requestBackgroundTone).toBe(
      initialRequestBackgroundTone,
    );
  });
});
