import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsOptionList } from "../SettingsOptionList";

const options = [
  { value: "DZD", label: "Algerian Dinar", trailingText: "DZD" },
  { value: "ARS", label: "Argentine Peso", trailingText: "ARS" },
];

describe("SettingsOptionList", () => {
  it("shows each option, the code of the others and marks the selected one", () => {
    render(
      <SettingsOptionList
        options={options}
        selectedValue="DZD"
        onSelectOption={jest.fn()}
        testID="currency"
      />,
    );

    expect(screen.getByTestId("currency-option-DZD")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("currency-option-ARS")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("ARS")).toBeInTheDocument();
    expect(screen.queryByText("DZD")).not.toBeInTheDocument();
  });

  it("reports the option the user picks", async () => {
    const user = userEvent.setup();
    const onSelectOption = jest.fn();
    render(
      <SettingsOptionList options={options} onSelectOption={onSelectOption} testID="currency" />,
    );

    await user.click(screen.getByTestId("currency-option-ARS"));

    expect(onSelectOption).toHaveBeenCalledWith("ARS");
  });

  it("filters the options and shows the empty label when nothing matches", async () => {
    const user = userEvent.setup();
    render(
      <SettingsOptionList
        options={options}
        onSelectOption={jest.fn()}
        search={{ placeholder: "Search", emptyLabel: "No currency found" }}
        testID="currency"
      />,
    );

    await user.type(screen.getByTestId("currency-search"), "peso");
    expect(screen.queryByTestId("currency-option-DZD")).not.toBeInTheDocument();
    expect(screen.getByTestId("currency-option-ARS")).toBeInTheDocument();

    await user.clear(screen.getByTestId("currency-search"));
    await user.type(screen.getByTestId("currency-search"), "yen");
    expect(screen.getByText("No currency found")).toBeInTheDocument();
  });
});
