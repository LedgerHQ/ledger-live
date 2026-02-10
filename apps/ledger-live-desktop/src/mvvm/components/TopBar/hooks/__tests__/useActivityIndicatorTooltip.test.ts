import { renderHook } from "tests/testSetup";
import { useActivityIndicatorTooltip } from "../useActivityIndicatorTooltip";

describe("useActivityIndicatorTooltip", () => {
  it("returns emptyErrorToolTip when listOfErrorAccountNames is empty but isError is true", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: true,
        listOfErrorAccountNames: "",
        lastSyncMs: 0,
      }),
    );
    expect(result.current).toBe(
      "There was a temporary network issue. Your assets are safe. Tap to retry",
    );
  });

  it("returns error tooltip when isError is true and listOfErrorAccountNames is not empty", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: true,
        listOfErrorAccountNames: "BTC/ETH",
        lastSyncMs: 1000,
      }),
    );
    expect(result.current).toBe(
      "There was a temporary network issue. Your assets are safe. List of accounts impacted: BTC/ETH. Tap to retry",
    );
  });

  it("returns last-sync descriptor message when lastSyncMs > 0 and not error", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: false,
        isError: false,
        listOfErrorAccountNames: "",
        lastSyncMs: Date.now() - 5 * 60 * 1000,
      }),
    );
    expect(result.current).toContain("Last sync: 5 mins ago. Tap to refresh");
    expect(result.current).toContain("5");
  });

  it("returns null when isRotating is true", () => {
    const { result } = renderHook(() =>
      useActivityIndicatorTooltip({
        isRotating: true,
        isError: false,
        listOfErrorAccountNames: "",
        lastSyncMs: 0,
      }),
    );
    expect(result.current).toBeNull();
  });
});
