import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HiddenSettingsProvider } from "../../HiddenSettingsProvider/HiddenSettingsProvider";
import { SettingsRow } from "../SettingsRow";

describe("SettingsRow", () => {
  it("shows the title, the description and the description link", async () => {
    const user = userEvent.setup();
    const onSelectLink = jest.fn();
    render(
      <SettingsRow
        title="MEV protection"
        description="Enable for more reliable transactions"
        descriptionLink={{ label: "Learn more", onSelect: onSelectLink }}
        testID="settings-row"
      />,
    );

    expect(screen.getByText("MEV protection")).toBeInTheDocument();
    expect(screen.getByText("Enable for more reliable transactions")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Learn more" }));
    expect(onSelectLink).toHaveBeenCalledTimes(1);
  });

  it("selects the row when it leads somewhere", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow title="Crypto assets" trailing={{ type: "chevron", onSelect }} testID="row" />,
    );

    await user.click(screen.getByTestId("row"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not select a disabled row", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow
        title="Crypto assets"
        trailing={{ type: "externalLink", onSelect }}
        disabled
        testID="row"
      />,
    );

    await user.click(screen.getByTestId("row"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows a toggle", () => {
    render(
      <SettingsRow
        title="Hide balance"
        trailing={{ type: "toggle", value: false, onToggle: jest.fn() }}
        testID="row"
      />,
    );

    expect(screen.getByTestId("row-toggle")).toBeInTheDocument();
  });

  it("shows a value", () => {
    render(<SettingsRow title="Version" trailing={{ type: "value", text: "2.140.0" }} />);

    expect(screen.getByText("2.140.0")).toBeInTheDocument();
  });

  it("shows the selected option and reports the new one", async () => {
    const user = userEvent.setup();
    const onSelectOption = jest.fn();
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
          onSelectOption,
        }}
      />,
    );

    expect(screen.getByRole("option", { name: "Dark" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("option", { name: "Light" }));
    expect(onSelectOption).toHaveBeenCalledWith("light");
  });

  it("calls the button action", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <SettingsRow title="Wallet sync" trailing={{ type: "button", label: "Manage", onSelect }} />,
    );

    await user.click(screen.getByRole("button", { name: "Manage" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("is not rendered when the app hides it", () => {
    render(
      <HiddenSettingsProvider rowsToHide={["mockAppUpdate"]}>
        <SettingsRow title="Mock app update" settingId="mockAppUpdate" testID="hidden-row" />
        <SettingsRow title="My Ledger provider" settingId="myLedgerProvider" testID="shown-row" />
      </HiddenSettingsProvider>,
    );

    expect(screen.queryByTestId("hidden-row")).not.toBeInTheDocument();
    expect(screen.getByTestId("shown-row")).toBeInTheDocument();
  });
});
