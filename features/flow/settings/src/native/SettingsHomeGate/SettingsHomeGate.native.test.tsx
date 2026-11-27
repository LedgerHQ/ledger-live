import React from "react";
import { Text } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { useFeature } from "@features/platform-feature-flags";
import { TrackScreen } from "@shared/analytics-react";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { SettingsHomeGate } from "./SettingsHomeGate";

jest.mock("@features/platform-feature-flags", () => ({ useFeature: jest.fn() }));
jest.mock("@shared/analytics-react", () => ({ TrackScreen: jest.fn(() => null) }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUseFeature = jest.mocked(useFeature);

function renderGate(onSelectSection = jest.fn()) {
  render(
    <SettingsHomeGate
      onSelectSection={onSelectSection}
      legacySettings={<Text>Legacy settings</Text>}
      rowsToHide={[]}
      testID="settings-home"
    />,
    { wrapper: I18nWrapper },
  );
  return onSelectSection;
}

describe("SettingsHomeGate", () => {
  beforeEach(() => {
    jest.mocked(TrackScreen).mockClear();
  });

  it("shows the legacy home while the flag is off", () => {
    mockUseFeature.mockReturnValue({ enabled: false });

    renderGate();

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-home")).toBeNull();
    expect(TrackScreen).not.toHaveBeenCalled();
  });

  it("shows the new home and tracks the Settings page when the flag is on", () => {
    mockUseFeature.mockReturnValue({ enabled: true });

    renderGate();

    expect(screen.getByTestId("settings-home")).toBeVisible();
    expect(screen.queryByText("Legacy settings")).toBeNull();
    expect(TrackScreen).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Settings" }),
      undefined,
    );
  });

  it("opens the section of the pressed row", async () => {
    mockUseFeature.mockReturnValue({ enabled: true });
    const user = userEvent.setup();
    const onSelectSection = renderGate();

    await user.press(screen.getByTestId("settings-home-general"));

    expect(onSelectSection).toHaveBeenCalledWith("general");
  });

  it("opens the developer tools the app gives from the new home", async () => {
    mockUseFeature.mockReturnValue({ enabled: true });
    const user = userEvent.setup();
    const onOpenDebug = jest.fn();
    render(
      <SettingsHomeGate
        onSelectSection={jest.fn()}
        legacySettings={<Text>Legacy settings</Text>}
        rowsToHide={[]}
        devTools={{ onOpenDeveloper: jest.fn(), onOpenDebug }}
      />,
      { wrapper: I18nWrapper },
    );

    await user.press(screen.getByTestId("settings-home-debug"));

    expect(onOpenDebug).toHaveBeenCalledTimes(1);
  });

  it("switches back to the legacy Settings from the new home", async () => {
    mockUseFeature.mockReturnValue({ enabled: true });
    const user = userEvent.setup();
    const onSwitchToLegacySettings = jest.fn();
    render(
      <SettingsHomeGate
        onSelectSection={jest.fn()}
        legacySettings={<Text>Legacy settings</Text>}
        rowsToHide={[]}
        onSwitchToLegacySettings={onSwitchToLegacySettings}
      />,
      { wrapper: I18nWrapper },
    );

    await user.press(screen.getByTestId("settings-home-switch-to-legacy"));

    expect(onSwitchToLegacySettings).toHaveBeenCalledTimes(1);
  });
});
