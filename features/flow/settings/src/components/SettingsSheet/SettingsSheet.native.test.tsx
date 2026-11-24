import React from "react";
import { Text } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SettingsSheet } from "./SettingsSheet";

describe("SettingsSheet", () => {
  it("shows the title, the description and the content when open", () => {
    render(
      <SettingsSheet
        isOpen
        title="Theme"
        description="Pick how the app looks"
        onClose={jest.fn()}
        testID="theme-sheet"
      >
        <Text>Dark</Text>
      </SettingsSheet>,
    );

    const header = screen.getByTestId("theme-sheet-header");
    expect(header).toHaveProp("title", "Theme");
    expect(header).toHaveProp("description", "Pick how the app looks");
    expect(screen.getByText("Dark")).toBeTruthy();
  });

  it("does not render its content when closed", () => {
    render(
      <SettingsSheet isOpen={false} title="Theme" onClose={jest.fn()} testID="theme-sheet">
        <Text>Dark</Text>
      </SettingsSheet>,
    );

    expect(screen.queryByText("Dark")).toBeNull();
  });

  it("reports the close of the sheet", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<SettingsSheet isOpen title="Theme" onClose={onClose} testID="theme-sheet" />);

    await user.press(screen.getByTestId("theme-sheet-dismiss"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
