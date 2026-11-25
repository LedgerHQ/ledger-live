import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useIsNewSettingsPage } from "./useIsNewSettingsPage";

function renderIsNewSettingsPage(pathname: string, isFlagEnabled: boolean) {
  return renderHook(() => useIsNewSettingsPage(pathname), {
    initialState: withFlagOverrides({ newSettings: { enabled: isFlagEnabled } }),
  }).result.current;
}

describe("useIsNewSettingsPage", () => {
  it.each(["/settings", "/settings/", "/settings/security", "/settings/general/foo"])(
    "is true for %s when the flag is ON",
    pathname => {
      expect(renderIsNewSettingsPage(pathname, true)).toBe(true);
    },
  );

  it.each(["/settings", "/settings/security"])("is false for %s when the flag is OFF", pathname => {
    expect(renderIsNewSettingsPage(pathname, false)).toBe(false);
  });

  it.each(["/settings/help", "/settings/experimental", "/settings/developer"])(
    "is false for %s which still uses the legacy settings",
    pathname => {
      expect(renderIsNewSettingsPage(pathname, true)).toBe(false);
    },
  );

  it.each(["/", "/market", "/settingsfoo"])("is false for %s", pathname => {
    expect(renderIsNewSettingsPage(pathname, true)).toBe(false);
  });
});
