import { renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useRightPanelViewModel } from "../useRightPanelViewModel";

describe("useRightPanelViewModel", () => {
  it("enables the right panel when wallet 4.0 and ptxSwap flags are enabled", () => {
    const { result } = renderHook(() => useRightPanelViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lwdWallet40: { enabled: true, params: {} },
            ptxSwapLiveAppOnPortfolio: { enabled: true },
          },
        },
      },
    });

    expect(result.current.shouldDisplay).toBe(true);
  });

  it("disables the right panel when wallet 4.0 is disabled", () => {
    const { result } = renderHook(() => useRightPanelViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lwdWallet40: { enabled: false, params: {} },
            ptxSwapLiveAppOnPortfolio: { enabled: true },
          },
        },
      },
    });

    expect(result.current.shouldDisplay).toBe(false);
  });

  it("disables the right panel when ptxSwap flag is absent", () => {
    const { result } = renderHook(() => useRightPanelViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          overriddenFeatureFlags: {
            ...INITIAL_STATE.overriddenFeatureFlags,
            lwdWallet40: { enabled: true, params: {} },
          },
        },
      },
    });

    expect(result.current.shouldDisplay).toBe(false);
  });
});
