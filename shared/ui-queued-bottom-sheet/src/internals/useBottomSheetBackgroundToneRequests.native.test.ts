import { renderHook, act } from "@testing-library/react-native";
import { useBottomSheetBackgroundToneRequests } from "./useBottomSheetBackgroundToneRequests";
import { BottomSheetBackgroundContext } from "../contexts/BottomSheetBackgroundContext";

describe("useBottomSheetBackgroundToneRequests", () => {
  it("exposes the shared BottomSheetBackgroundContext", () => {
    expect(BottomSheetBackgroundContext).toBeDefined();
  });

  it("starts with no background tone", () => {
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());
    expect(result.current.backgroundTone).toBeUndefined();
  });

  it("applies a requested tone", () => {
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());

    act(() => {
      result.current.backgroundContextValue.requestBackgroundTone("error");
    });

    expect(result.current.backgroundTone).toBe("error");
  });

  it("gives the latest requester priority and restores the previous tone on cleanup (LIFO)", () => {
    const { result } = renderHook(() => useBottomSheetBackgroundToneRequests());

    let cleanupError!: () => void;
    let cleanupInfo!: () => void;

    act(() => {
      cleanupError = result.current.backgroundContextValue.requestBackgroundTone("error");
    });
    expect(result.current.backgroundTone).toBe("error");

    act(() => {
      cleanupInfo = result.current.backgroundContextValue.requestBackgroundTone("info");
    });
    expect(result.current.backgroundTone).toBe("info");

    act(() => {
      cleanupInfo();
    });
    expect(result.current.backgroundTone).toBe("error");

    act(() => {
      cleanupError();
    });
    expect(result.current.backgroundTone).toBeUndefined();
  });
});
