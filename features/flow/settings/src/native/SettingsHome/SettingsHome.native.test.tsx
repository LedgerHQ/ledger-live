import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { SettingsHome } from "./SettingsHome";

describe("SettingsHome", () => {
  it("shows one row per section, in the order of the design", () => {
    render(<SettingsHome onSelectSection={jest.fn()} testID="settings-home" />, {
      wrapper: I18nWrapper,
    });

    const labels = ["General", "Asset management", "Security", "Notifications", "Privacy", "About"];
    for (const label of labels) {
      expect(screen.getByText(label)).toBeVisible();
    }
    expect(
      screen.getAllByText(new RegExp(labels.join("|"))).map(node => node.props.children),
    ).toEqual(labels);
  });

  it("opens the section of the pressed row", async () => {
    const user = userEvent.setup();
    const onSelectSection = jest.fn();
    render(<SettingsHome onSelectSection={onSelectSection} />, { wrapper: I18nWrapper });

    await user.press(screen.getByTestId("settings-home-notifications"));

    expect(onSelectSection).toHaveBeenCalledWith("notifications");
  });

  it("shows no developer tool row when the app gives none", () => {
    render(<SettingsHome onSelectSection={jest.fn()} />, { wrapper: I18nWrapper });

    expect(screen.queryByTestId("settings-home-developer")).toBeNull();
    expect(screen.queryByTestId("settings-home-debug")).toBeNull();
  });

  it("shows the Developer row alone when the app does not open Debug", () => {
    render(<SettingsHome onSelectSection={jest.fn()} devTools={{ onOpenDeveloper: jest.fn() }} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("Developer")).toBeVisible();
    expect(screen.queryByTestId("settings-home-debug")).toBeNull();
  });

  it("shows Developer then Debug after the sections and opens the pressed one", async () => {
    const user = userEvent.setup();
    const onOpenDeveloper = jest.fn();
    const onOpenDebug = jest.fn();
    render(
      <SettingsHome onSelectSection={jest.fn()} devTools={{ onOpenDeveloper, onOpenDebug }} />,
      { wrapper: I18nWrapper },
    );

    expect(
      screen.getAllByText(/^(About|Developer|Debug)$/).map(node => node.props.children),
    ).toEqual(["About", "Developer", "Debug"]);

    await user.press(screen.getByTestId("settings-home-developer"));
    expect(onOpenDeveloper).toHaveBeenCalledTimes(1);

    await user.press(screen.getByTestId("settings-home-debug"));
    expect(onOpenDebug).toHaveBeenCalledTimes(1);
  });

  it("shows no row back to the legacy Settings when the app gives no callback", () => {
    render(<SettingsHome onSelectSection={jest.fn()} />, { wrapper: I18nWrapper });

    expect(screen.queryByTestId("settings-home-switch-to-legacy")).toBeNull();
  });

  it("shows the row back to the legacy Settings last, and switches when pressed", async () => {
    const user = userEvent.setup();
    const onSwitchToLegacySettings = jest.fn();
    render(
      <SettingsHome
        onSelectSection={jest.fn()}
        devTools={{ onOpenDeveloper: jest.fn(), onOpenDebug: jest.fn() }}
        onSwitchToLegacySettings={onSwitchToLegacySettings}
      />,
      { wrapper: I18nWrapper },
    );

    expect(
      screen
        .getAllByText(/^(About|Developer|Debug|Back to previous Settings)$/)
        .map(node => node.props.children),
    ).toEqual(["About", "Developer", "Debug", "Back to previous Settings"]);

    await user.press(screen.getByTestId("settings-home-switch-to-legacy"));

    expect(onSwitchToLegacySettings).toHaveBeenCalledTimes(1);
  });
});
