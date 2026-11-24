import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  it("shows the title, the five sections and the content of the selected one", () => {
    render(
      <SettingsPage selectedSection="security" onSelectSection={jest.fn()} testID="settings-page">
        <span>Security content</span>
      </SettingsPage>,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText("Settings")).toBeVisible();
    for (const [id, label] of [
      ["general", "General"],
      ["assetManagement", "Asset management"],
      ["security", "Security"],
      ["privacy", "Privacy"],
      ["about", "About"],
    ]) {
      expect(screen.getByTestId(`settings-tab-${id}`)).toHaveTextContent(label);
    }
    expect(screen.getByText("Security content")).toBeVisible();
  });
});
