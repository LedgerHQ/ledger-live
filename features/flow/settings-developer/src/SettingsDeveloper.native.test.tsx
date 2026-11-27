import React from "react";
import { render, screen } from "@testing-library/react-native";
import { SettingsDeveloper } from "./SettingsDeveloper";

describe("SettingsDeveloper on mobile", () => {
  it("renders the section", () => {
    render(<SettingsDeveloper testID="settings-developer" />);

    expect(screen.getByTestId("settings-developer")).toBeTruthy();
  });
});
