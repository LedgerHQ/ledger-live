import React from "react";
import { render, screen } from "tests/testSetup";
import ButtonDropdownDefaultTrigger from "../ButtonDropdownDefaultTrigger";
import type { ButtonDropdownItem } from "../types";

describe("ButtonDropdownDefaultTrigger", () => {
  it("should render selected option label", () => {
    const selectedOption: ButtonDropdownItem = { key: "x", label: "My Option" };
    render(<ButtonDropdownDefaultTrigger selectedOption={selectedOption} />);

    expect(screen.getByText("My Option")).toBeVisible();
  });

  it("should render when label is a React node", () => {
    const selectedOption: ButtonDropdownItem = {
      key: "y",
      label: <span data-testid="custom-label">Custom</span>,
    };
    render(<ButtonDropdownDefaultTrigger selectedOption={selectedOption} />);

    expect(screen.getByTestId("custom-label")).toBeVisible();
    expect(screen.getByText("Custom")).toBeVisible();
  });
});
