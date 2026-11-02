import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import { useDevTools } from "../useDevTools";

describe("useDevTools", () => {
  it("is hidden outside developer mode", () => {
    const { result } = renderHook(() => useDevTools());

    expect(result.current.isVisible).toBe(false);
  });

  it("is visible in developer mode, with a translated tooltip", () => {
    const { result } = renderHook(() => useDevTools(), {
      initialState: { settings: { ...SETTINGS_INITIAL_STATE, developerMode: true } },
    });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.tooltip).toBe("Dev tools");
  });
});
