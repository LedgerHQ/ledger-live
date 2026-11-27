import React from "react";
import { render, screen } from "@testing-library/react";
import { SettingsDeveloper } from "./SettingsDeveloper";

describe("SettingsDeveloper", () => {
  it("renders the section", () => {
    render(<SettingsDeveloper testID="settings-developer" />);

    expect(screen.getByTestId("settings-developer")).toBeInTheDocument();
  });
});
