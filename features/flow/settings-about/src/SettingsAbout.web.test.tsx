import React from "react";
import { render, screen } from "@testing-library/react";
import { SettingsAbout } from "./SettingsAbout";

describe("SettingsAbout", () => {
  it("renders the section", () => {
    render(<SettingsAbout testID="settings-about" />);

    expect(screen.getByTestId("settings-about")).toBeInTheDocument();
  });
});
