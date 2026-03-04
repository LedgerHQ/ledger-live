import React from "react";
import { render, screen } from "tests/testSetup";
import ToolTip from "../Tooltip";
import Tippy from "@tippyjs/react";

jest.mock("@tippyjs/react", () => ({
  __esModule: true,
  default: jest.fn((props: { disabled?: boolean; children?: React.ReactNode }) =>
    React.createElement("div", {
      "data-testid": "tippy-mock",
      "data-disabled": props.disabled,
    }),
  ),
}));

describe("Tooltip", () => {
  beforeEach(() => {
    (Tippy as unknown as jest.Mock).mockClear();
  });

  it("renders trigger children", () => {
    render(
      <ToolTip content="Tooltip text">
        <button type="button">Hover me</button>
      </ToolTip>,
      { minimal: false },
    );

    expect(screen.getByRole("button", { name: /hover me/i })).toBeInTheDocument();
  });

  it("disables tooltip when content is empty", () => {
    render(
      <ToolTip content="">
        <span>Trigger</span>
      </ToolTip>,
      { minimal: false },
    );

    expect(screen.getByText("Trigger")).toBeInTheDocument();
    expect(Tippy).toHaveBeenCalled();
    const tippyProps = (Tippy as unknown as jest.Mock).mock.calls[0]?.[0];
    expect(tippyProps).toHaveProperty("disabled", true);
  });
});
