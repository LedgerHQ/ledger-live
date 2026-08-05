import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SanctionedAddressBanner } from "./SanctionedAddressBanner.web";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = require("react");

  return {
    Banner: ({
      description,
      primaryAction,
      ...props
    }: {
      description: string;
      primaryAction?: React.ReactNode;
    }) => React.createElement("div", props, description, primaryAction),
    Button: ({
      children,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) =>
      React.createElement("button", { type: "button", ...props }, children),
  };
});

describe("SanctionedAddressBanner", () => {
  it("should render the supplied feedback and invoke its action", async () => {
    const onAction = jest.fn();
    const user = userEvent.setup();

    render(
      <SanctionedAddressBanner
        description="This wallet address is sanctioned."
        actionLabel="Learn more"
        onAction={onAction}
      />
    );

    expect(
      screen.getByTestId("contacts-sanctioned-address-banner")
    ).toBeVisible();
    expect(
      screen.getByText("This wallet address is sanctioned.")
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Learn more" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
