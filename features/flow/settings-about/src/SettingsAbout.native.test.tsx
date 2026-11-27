import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SettingsAbout } from "./SettingsAbout";

describe("SettingsAbout on mobile", () => {
  it("renders the section", () => {
    render(<SettingsAbout testID="settings-about" />);

    expect(screen.getByTestId("settings-about")).toBeTruthy();
  });
});
