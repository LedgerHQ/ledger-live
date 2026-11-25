import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsRowDescription } from "../components/SettingsRowDescription/SettingsRowDescription";

describe("SettingsRowDescription", () => {
  const onKeyDownAbove = jest.fn();

  beforeEach(() => {
    onKeyDownAbove.mockClear();
    document.addEventListener("keydown", onKeyDownAbove);
  });

  afterEach(() => {
    document.removeEventListener("keydown", onKeyDownAbove);
  });

  it("keeps Enter on its link from reaching the row", async () => {
    const user = userEvent.setup();
    const onSelectLink = jest.fn();
    render(
      <SettingsRowDescription
        description="Share anonymous usage"
        link={{ label: "Learn more", onSelect: onSelectLink }}
      />,
    );

    screen.getByRole("button", { name: "Learn more" }).focus();
    await user.keyboard("{Enter}");

    expect(onSelectLink).toHaveBeenCalledTimes(1);
    expect(onKeyDownAbove).not.toHaveBeenCalled();
  });

  it("does not run the link of a disabled row", async () => {
    const user = userEvent.setup();
    const onSelectLink = jest.fn();
    render(
      <SettingsRowDescription link={{ label: "Learn more", onSelect: onSelectLink }} disabled />,
    );

    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(onSelectLink).not.toHaveBeenCalled();
  });
});
