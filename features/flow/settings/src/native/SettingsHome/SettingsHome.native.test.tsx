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
});
