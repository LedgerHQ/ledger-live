import React from "react";
import { render, screen } from "tests/testSetup";
import Select from ".";

const options = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ru", label: "Русский" },
  { value: "es", label: "Español" },
  { value: "ja", label: "日本語" },
];

describe("Select", () => {
  it("should position the virtual menu list so the overlay of menuShouldBlockScroll does not cover its scrollbar", async () => {
    const { user } = render(<Select options={options} value={options[0]} onChange={jest.fn()} />);

    await user.click(screen.getByRole("combobox"));

    expect(await screen.findByTestId("select-menu-list")).toHaveStyle({ position: "relative" });
  });
});
