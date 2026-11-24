import React from "react";
import { render, screen } from "@testing-library/react";
import { SettingsSection } from "./SettingsSection";

describe("SettingsSection", () => {
  it("shows its title and its rows", () => {
    render(
      <SettingsSection title="Connect with us" testID="settings-section">
        <span>Follow us on X</span>
      </SettingsSection>,
    );

    expect(screen.getByText("Connect with us")).toBeVisible();
    expect(screen.getByText("Follow us on X")).toBeVisible();
  });

  it("renders without a title", () => {
    render(
      <SettingsSection testID="settings-section">
        <span>Theme</span>
      </SettingsSection>,
    );

    expect(screen.getByTestId("settings-section")).toBeVisible();
    expect(screen.getByText("Theme")).toBeVisible();
  });
});
