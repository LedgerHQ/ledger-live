import React from "react";
import { render, screen } from "tests/testSetup";
import ButtonDropdownOptionItem from "../ButtonDropdownOptionItem";
import type { ButtonDropdownItem } from "../types";

describe("ButtonDropdownOptionItem", () => {
  it("should render item label", () => {
    const item: ButtonDropdownItem = { key: "k", label: "Item label" };
    render(<ButtonDropdownOptionItem item={item} isActive={false} id="option-item-1" />);

    expect(screen.getByText("Item label")).toBeVisible();
  });

  it("should apply id to root when provided", () => {
    const item: ButtonDropdownItem = { key: "k", label: "Item" };
    render(<ButtonDropdownOptionItem item={item} isActive={false} id="option-item-2" />);

    expect(document.getElementById("option-item-1")).toBeInTheDocument();
  });

  it("should show check icon when isActive is true", () => {
    const item: ButtonDropdownItem = { key: "k", label: "Active item" };
    const { container } = render(
      <ButtonDropdownOptionItem item={item} isActive={true} id="option-item-3" />,
    );

    expect(screen.getByText("Active item")).toBeVisible();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should not show check icon when isActive is false", () => {
    const item: ButtonDropdownItem = { key: "k", label: "Inactive item" };
    const { container } = render(
      <ButtonDropdownOptionItem item={item} isActive={false} id="option-item-4" />,
    );

    expect(screen.getByText("Inactive item")).toBeVisible();
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
