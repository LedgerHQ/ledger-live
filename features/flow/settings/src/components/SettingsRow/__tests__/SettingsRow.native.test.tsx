import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { HiddenSettingsProvider } from "../../HiddenSettingsProvider/HiddenSettingsProvider";
import { SettingsRow } from "../SettingsRow";

describe("SettingsRow", () => {
  it("shows the title and the description", () => {
    render(<SettingsRow title="Hide balance" description="Hide amounts" testID="settings-row" />);

    expect(screen.getByText("Hide balance")).toBeVisible();
    expect(screen.getByText("Hide amounts")).toBeVisible();
  });

  it("selects the row when it leads somewhere", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(<SettingsRow title="General" trailing={{ type: "chevron", onSelect }} testID="row" />);

    await user.press(screen.getByTestId("row"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not select a disabled row", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow
        title="General"
        trailing={{ type: "chevron", onSelect }}
        disabled
        testID="row"
      />,
    );

    await user.press(screen.getByTestId("row"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("is not rendered when the app hides it", () => {
    render(
      <HiddenSettingsProvider rowsToHide={["myLedgerProvider"]}>
        <SettingsRow title="My Ledger provider" settingId="myLedgerProvider" testID="hidden-row" />
      </HiddenSettingsProvider>,
    );

    expect(screen.queryByTestId("hidden-row")).toBeNull();
  });

  it("names the toggle after the row", () => {
    render(
      <SettingsRow
        title="Hide balance"
        trailing={{ type: "toggle", value: false, onToggle: jest.fn() }}
        testID="hide-balance"
      />,
    );

    expect(screen.getByTestId("hide-balance-toggle")).toHaveProp(
      "accessibilityLabel",
      "Hide balance",
    );
  });

  it("keeps the description link inert in a disabled row", async () => {
    const user = userEvent.setup();
    const onSelectLink = jest.fn();
    render(
      <SettingsRow
        title="Analytics"
        descriptionLink={{ label: "Learn more", onSelect: onSelectLink }}
        disabled
      />,
    );

    await user.press(screen.getByText("Learn more"));

    expect(onSelectLink).not.toHaveBeenCalled();
  });

  it("opens the description link of an enabled row", async () => {
    const user = userEvent.setup();
    const onSelectLink = jest.fn();
    render(
      <SettingsRow
        title="Analytics"
        descriptionLink={{ label: "Learn more", onSelect: onSelectLink }}
      />,
    );

    await user.press(screen.getByText("Learn more"));

    expect(onSelectLink).toHaveBeenCalledTimes(1);
  });

  it("shows a value", () => {
    render(<SettingsRow title="Version" trailing={{ type: "value", text: "4.2.0" }} />);

    expect(screen.getByText("4.2.0")).toBeVisible();
  });

  it("shows the label of the selected option", () => {
    render(
      <SettingsRow
        title="Theme"
        trailing={{
          type: "select",
          value: "dark",
          options: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ],
          onSelectOption: jest.fn(),
        }}
      />,
    );

    expect(screen.getByText("Dark")).toBeVisible();
    expect(screen.queryByText("Light")).toBeNull();
  });

  it("runs the button action", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow title="Ledger Sync" trailing={{ type: "button", label: "Manage", onSelect }} />,
    );

    await user.press(screen.getByText("Manage"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("opens an external link from the whole row", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow
        title="Support"
        trailing={{ type: "externalLink", onSelect }}
        testID="support"
      />,
    );

    await user.press(screen.getByTestId("support"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
