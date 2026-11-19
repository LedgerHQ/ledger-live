import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { HiddenSettingsProvider } from "../HiddenSettingsProvider/HiddenSettingsProvider";
import { SettingsRow } from "./SettingsRow";

describe("SettingsRow", () => {
  it("shows the title and the description", () => {
    render(<SettingsRow title="Hide balance" description="Hide amounts" testID="settings-row" />);

    expect(screen.getByText("Hide balance")).toBeTruthy();
    expect(screen.getByText("Hide amounts")).toBeTruthy();
  });

  it("selects the row when it leads somewhere", () => {
    const onSelect = jest.fn();
    render(<SettingsRow title="General" trailing={{ type: "chevron", onSelect }} testID="row" />);

    fireEvent.press(screen.getByTestId("row"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("is not rendered when the app hides it", () => {
    render(
      <HiddenSettingsProvider rowsToHide={["myLedgerProvider"]}>
        <SettingsRow title="My Ledger provider" settingId="myLedgerProvider" testID="hidden-row" />
      </HiddenSettingsProvider>,
    );

    expect(screen.queryByTestId("hidden-row")).toBeNull();
  });
});
