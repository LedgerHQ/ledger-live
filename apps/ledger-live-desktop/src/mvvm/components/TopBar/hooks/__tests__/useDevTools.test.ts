import { Code } from "@ledgerhq/lumen-ui-react/symbols";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { openDevToolsWindow } from "LLD/features/DevTools/components/DevToolsWindow/devToolsWindow";
import { useDevTools } from "../useDevTools";

describe("useDevTools", () => {
  it("opens the DevTools window, with icon and translated tooltip", () => {
    const { result } = renderHook(() => useDevTools());

    expect(result.current.handleDevTools).toBe(openDevToolsWindow);
    expect(result.current.icon).toBe(Code);
    expect(result.current.tooltip).toBe("Dev tools");
  });

  it("returns isVisible false when not in developer mode, banner hidden and no overridden flags", () => {
    const { result } = renderHook(() => useDevTools(), {
      initialState: withFlagOverrides({}),
    });

    expect(result.current.isVisible).toBe(false);
  });

  it("returns isVisible true in developer mode", () => {
    const { result } = renderHook(() => useDevTools(), {
      initialState: {
        ...withFlagOverrides({}),
        settings: { ...SETTINGS_INITIAL_STATE, developerMode: true },
      },
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("returns isVisible true when bannerVisible is true", () => {
    const flagOverrides = withFlagOverrides({});
    const { result } = renderHook(() => useDevTools(), {
      initialState: {
        featureFlags: {
          ...flagOverrides.featureFlags,
          bannerVisible: true,
        },
      },
    });

    expect(result.current.isVisible).toBe(true);
  });

  it("returns isVisible true when overridden feature flags exist", () => {
    const flagOverrides = withFlagOverrides({ currencyAvalancheCChain: { enabled: true } });
    const { result } = renderHook(() => useDevTools(), {
      initialState: {
        featureFlags: {
          ...flagOverrides.featureFlags,
          bannerVisible: false,
        },
      },
    });

    expect(result.current.isVisible).toBe(true);
  });
});
