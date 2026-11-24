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

  it("keeps its content while closing, until the sheet is hidden", async () => {
    const user = userEvent.setup();
    const sheet = (isOpen: boolean) => (
      <SettingsSheet isOpen={isOpen} title="Theme" onClose={jest.fn()} testID="theme-sheet">
        <Text>Dark</Text>
      </SettingsSheet>
    );
    const { rerender } = render(sheet(true));

    rerender(sheet(false));
    expect(screen.getByText("Dark")).toBeVisible();

    await user.press(screen.getByTestId("theme-sheet-hidden"));
    expect(screen.queryByText("Dark")).toBeNull();
  });

  it("keeps its content when reopened before being hidden", async () => {
    const user = userEvent.setup();
    const sheet = (isOpen: boolean) => (
      <SettingsSheet isOpen={isOpen} title="Theme" onClose={jest.fn()} testID="theme-sheet">
        <Text>Dark</Text>
      </SettingsSheet>
    );
    const { rerender } = render(sheet(true));

    rerender(sheet(false));
    rerender(sheet(true));
    await user.press(screen.getByTestId("theme-sheet-hidden"));

    expect(screen.getByText("Dark")).toBeVisible();
  });

  it("offers no way to dismiss it while it cannot close", () => {
    render(
      <SettingsSheet isOpen title="Theme" onClose={jest.fn()} canClose={false} testID="theme-sheet" />,
    );

    expect(screen.queryByTestId("theme-sheet-dismiss")).toBeNull();
  });
});
