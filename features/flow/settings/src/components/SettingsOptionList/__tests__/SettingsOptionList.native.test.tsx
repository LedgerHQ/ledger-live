import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { SettingsOptionList } from "../SettingsOptionList";

const options = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

describe("SettingsOptionList", () => {
  it("marks the selected option and reports the one the user picks", async () => {
    const user = userEvent.setup();
    const onSelectOption = jest.fn();
    render(
      <SettingsOptionList
        options={options}
        selectedValue="dark"
        onSelectOption={onSelectOption}
        testID="theme"
      />,
    );

    expect(screen.getByTestId("theme-option-dark")).toHaveProp("accessibilityState", {
      selected: true,
    });
    await user.press(screen.getByTestId("theme-option-light"));

    expect(onSelectOption).toHaveBeenCalledWith("light");
  });

  it("shows the search field with its placeholder", () => {
    render(
      <SettingsOptionList
        options={options}
        onSelectOption={jest.fn()}
        search={{ placeholder: "Search a theme", emptyLabel: "No theme found" }}
        testID="theme"
      />,
    );

    const searchField = screen.getByTestId("theme-search");
    expect(searchField).toHaveProp("placeholder", "Search a theme");
    expect(searchField).toHaveProp("value", "");
  });
});
