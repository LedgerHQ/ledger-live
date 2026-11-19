import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { SettingsSection } from "./SettingsSection";

describe("SettingsSection", () => {
  it("shows its title and its rows", () => {
    render(
      <SettingsSection title="Connect with us" testID="settings-section">
        <Text>Follow us on X</Text>
      </SettingsSection>,
    );

    expect(screen.getByText("Connect with us")).toBeTruthy();
    expect(screen.getByText("Follow us on X")).toBeTruthy();
  });
});
