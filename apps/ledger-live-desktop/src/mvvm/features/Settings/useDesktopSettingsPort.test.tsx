import { act, renderHook } from "tests/testSetup";
import { saveSettings } from "~/renderer/actions/settings";
import { useDesktopSettingsPort } from "./useDesktopSettingsPort";

function renderPort(settings: Parameters<typeof saveSettings>[0] = {}) {
  const hook = renderHook(() => useDesktopSettingsPort());
  act(() => {
    hook.store.dispatch(saveSettings(settings));
  });
  return hook;
}

describe("useDesktopSettingsPort", () => {
  it("reads the theme from the legacy store", () => {
    const { result } = renderPort({ theme: "dark" });

    expect(result.current.values.theme).toBe("dark");
  });

  it("reads the system theme when none is stored", () => {
    const { result } = renderPort({ theme: null });

    expect(result.current.values.theme).toBe("system");
  });

  it("stores a theme change and stores null for the system theme", () => {
    const { result, store } = renderPort();

    act(() => {
      result.current.setValue({ key: "theme", value: "light" });
    });
    expect(store.getState().settings.theme).toBe("light");

    act(() => {
      result.current.setValue({ key: "theme", value: "system" });
    });
    expect(store.getState().settings.theme).toBeNull();
  });

  it("re-reads the value after the store changes", () => {
    const { result, store } = renderPort({ theme: "light" });

    act(() => {
      store.dispatch(saveSettings({ theme: "dark" }));
    });

    expect(result.current.values.theme).toBe("dark");
  });
});
