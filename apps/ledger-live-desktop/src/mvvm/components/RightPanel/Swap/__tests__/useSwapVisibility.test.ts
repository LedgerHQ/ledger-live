import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useSwapVisibility } from "../useSwapVisibility";

describe("useSwapVisibility", () => {
  it("returns true when ptxSwap flag is enabled", () => {
    const { result } = renderHook(() => useSwapVisibility(), {
      initialState: withFlagOverrides({
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when ptxSwap flag is absent", () => {
    const { result } = renderHook(() => useSwapVisibility());

    expect(result.current).toBe(false);
  });
});
