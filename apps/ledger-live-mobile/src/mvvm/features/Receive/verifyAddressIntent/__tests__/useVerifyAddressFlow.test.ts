import { act, renderHook } from "@tests/test-renderer";
import { useVerifyAddressFlow } from "../useVerifyAddressFlow";
import { VERIFY_SELECTION as SELECTION } from "./verifySelection.fixture";

describe("useVerifyAddressFlow", () => {
  it("should not run any verification at first", () => {
    const { result } = renderHook(() => useVerifyAddressFlow());

    expect(result.current.deviceIntent.selection).toBeNull();
  });

  it("should mount the device verification right away on start", () => {
    const { result } = renderHook(() => useVerifyAddressFlow());

    act(() => result.current.start(SELECTION));

    expect(result.current.deviceIntent.selection).toEqual(SELECTION);
  });

  it("should forward onReady to the caller", () => {
    const onReady = jest.fn();
    const { result } = renderHook(() => useVerifyAddressFlow());

    act(() => result.current.start(SELECTION, { onReady }));
    act(() => result.current.deviceIntent.onReady());

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it.each(["verified", "mismatch", "dismissed"] as const)(
    "should unmount the verification and report %s to the caller",
    outcome => {
      const onDone = jest.fn();
      const { result } = renderHook(() => useVerifyAddressFlow());

      act(() => result.current.start(SELECTION, { onDone }));
      act(() => result.current.deviceIntent.onExit(outcome));

      expect(result.current.deviceIntent.selection).toBeNull();
      expect(onDone).toHaveBeenCalledWith(outcome);
    },
  );
});
