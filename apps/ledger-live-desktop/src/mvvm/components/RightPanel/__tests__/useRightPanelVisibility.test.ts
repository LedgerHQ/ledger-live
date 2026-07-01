import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useRightPanelVisibility } from "../useRightPanelVisibility";

describe("useRightPanelVisibility", () => {
  it("returns true when wallet 4.0 and ptxSwap flags are enabled", () => {
    const { result } = renderHook(() => useRightPanelVisibility(), {
      initialState: withFlagOverrides({
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when ptxSwap flag is absent", () => {
    const { result } = renderHook(() => useRightPanelVisibility());

    expect(result.current).toBe(false);
  });
});
