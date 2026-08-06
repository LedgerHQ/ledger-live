import React from "react";
import { render, screen } from "@testing-library/react";
import { AddressNameDisclaimer } from "./AddressNameDisclaimer.web";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = require("react");

  return {
    InteractiveIcon: ({
      icon: _icon,
      iconType: _iconType,
      size: _size,
      ...props
    }: Omit<React.ComponentProps<"button">, "icon"> & {
      icon: unknown;
      iconType: string;
      size: number;
    }) => React.createElement("button", props),
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
    TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
    TooltipContent: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { role: "tooltip" }, children),
  };
});

describe("AddressNameDisclaimer", () => {
  it("should render an accessible tooltip trigger with its description", () => {
    render(
      <AddressNameDisclaimer
        accessibilityLabel="Address name information"
        description="This name appears on your Ledger device."
      />,
    );

    expect(screen.getByRole("button", { name: "Address name information" })).toBeVisible();
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "This name appears on your Ledger device.",
    );
  });
});
