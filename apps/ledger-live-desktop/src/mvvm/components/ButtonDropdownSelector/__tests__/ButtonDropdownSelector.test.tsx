import React from "react";
import { render, screen } from "tests/testSetup";
import { ButtonDropdownSelector } from "../index";
import type { ButtonDropdownItem } from "../types";

const defaultItems: ButtonDropdownItem[] = [
  { key: "a", label: "Option A" },
  { key: "b", label: "Option B" },
  { key: "c", label: "Option C", disabled: true },
];

describe("ButtonDropdownSelector", () => {
  it("should render trigger with selected value label when value is set", () => {
    const value = defaultItems[0];
    render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={value}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Option A")).toBeVisible();
  });

  it("should render trigger without selected label when value is null", () => {
    render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={null}
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "" })).toBeVisible();
  });

  it("should apply buttonId to trigger wrapper when provided", () => {
    render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={defaultItems[0]}
        onChange={() => {}}
        buttonId="my-dropdown"
      />,
    );

    expect(document.getElementById("my-dropdown")).toBeInTheDocument();
  });

  it("should open menu and show items when trigger is clicked", async () => {
    const { user } = render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={defaultItems[0]}
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: /option a/i }));

    expect(screen.getByRole("menuitemcheckbox", { name: "Option A" })).toBeVisible();
    expect(screen.getByRole("menuitemcheckbox", { name: "Option B" })).toBeVisible();
    expect(screen.getByRole("menuitemcheckbox", { name: "Option C" })).toBeVisible();
  });

  it("should call onChange with selected item when a non-disabled item is clicked", async () => {
    const onChange = jest.fn();
    const { user } = render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={defaultItems[0]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /option a/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Option B" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(defaultItems[1]);
  });

  it("should not call onChange when disabled item is clicked", async () => {
    const onChange = jest.fn();
    const { user } = render(
      <ButtonDropdownSelector
        items={defaultItems}
        value={defaultItems[0]}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /option a/i }));
    const disabledItem = screen.getByRole("menuitemcheckbox", { name: "Option C" });
    await user.click(disabledItem);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("should render nothing in menu when items is empty", async () => {
    const { user } = render(
      <ButtonDropdownSelector
        items={[]}
        value={null}
        onChange={() => {}}
      />,
    );

    await user.click(screen.getByRole("button", { name: "" }));

    expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();
  });
});
