import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useRightPanelVisibility } from "../useRightPanelVisibility";

describe("useRightPanelVisibility", () => {
  it("returns true when wallet 4.0 and ptxSwap flags are enabled", () => {
    const { result } = renderHook(() => useRightPanelVisibility(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: {} },
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current).toBe(true);
  });

  it("returns false when wallet 4.0 is disabled", () => {
    const { result } = renderHook(() => useRightPanelVisibility(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: false, params: {} },
        ptxSwapLiveAppOnPortfolio: { enabled: true },
      }),
    });

    expect(result.current).toBe(false);
  });

  it("returns false when ptxSwap flag is absent", () => {
    const { result } = renderHook(() => useRightPanelVisibility(), {
      initialState: withFlagOverrides({
        lwdWallet40: { enabled: true, params: {} },
      }),
    });

    expect(result.current).toBe(false);
  });
});
