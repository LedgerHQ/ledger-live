import { renderHook } from "@testing-library/react";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { useSecuritySettingsLabels } from "./useSecuritySettingsLabels";

const renderLabels = (kind: Parameters<typeof useSecuritySettingsLabels>[0]) =>
  renderHook(() => useSecuritySettingsLabels(kind), { wrapper: I18nWrapper }).result.current;

describe("useSecuritySettingsLabels", () => {
  it("gives the wording of every row", () => {
    const labels = renderLabels(null);

    expect(labels.hideBalance.title).toBe("Hide balance");
    expect(labels.appLock.title).toBe("App lock");
    expect(labels.changePassword.action).toBe("Change");
    expect(labels.autoLock.title).toBe("Auto-lock");
    expect(labels.mevProtection).toMatchObject({
      title: "MEV protection",
      learnMore: "Learn more",
    });
  });

  it("lists the auto-lock options in order, ending with never", () => {
    const { options } = renderLabels(null).autoLock;

    expect(options).toEqual([
      { value: "1", label: "1 minute" },
      { value: "10", label: "10 minutes" },
      { value: "30", label: "30 minutes" },
      { value: "60", label: "1 hour" },
      { value: "-1", label: "Never" },
    ]);
  });

  it.each([
    ["faceId", "Face ID"],
    ["touchId", "Touch ID"],
    ["biometrics", "Biometrics"],
  ] as const)("names the biometrics after the device: %s", (kind, name) => {
    const { biometrics } = renderLabels(kind);

    expect(biometrics.title).toBe(name);
    expect(biometrics.description).toBe(`Use ${name} to open the app.`);
    expect(biometrics.disabledDescription).toBe(`To enable ${name}, turn on "App lock".`);
  });
});
