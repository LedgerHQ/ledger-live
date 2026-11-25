import { act, renderHook } from "@tests/test-renderer";
import { setTheme } from "~/actions/settings";
import { useMobileSettingsPort } from "./useMobileSettingsPort";

describe("useMobileSettingsPort", () => {
  it("reads the theme from the legacy store", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort());

    act(() => {
      store.dispatch(setTheme("dark"));
    });

    expect(result.current.values.theme).toBe("dark");
  });

  it("stores a theme change", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort());

    act(() => {
      result.current.setValue({ key: "theme", value: "light" });
    });

    expect(store.getState().settings.theme).toBe("light");
  });

  it("keeps the system theme as a value", () => {
    const { result, store } = renderHook(() => useMobileSettingsPort());

    act(() => {
      result.current.setValue({ key: "theme", value: "system" });
    });

    expect(store.getState().settings.theme).toBe("system");
    expect(result.current.values.theme).toBe("system");
  });
});
