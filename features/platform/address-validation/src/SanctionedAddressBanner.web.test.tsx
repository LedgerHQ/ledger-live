import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SanctionedAddressBanner } from "./SanctionedAddressBanner.web";

jest.mock("@ledgerhq/lumen-ui-react", () => {
  const React = require("react");

  return {
    Banner: ({
      description,
      primaryAction,
      "data-testid": testID,
    }: {
      description: string;
      primaryAction?: React.ReactNode;
      "data-testid"?: string;
    }) => React.createElement("div", { "data-testid": testID }, description, primaryAction),
    Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) =>
      React.createElement("button", { type: "button", onClick }, children),
  };
});

describe("SanctionedAddressBanner", () => {
  it("should render the injected content and invoke its action", () => {
    const onAction = jest.fn();

    render(
      <SanctionedAddressBanner
        title="Flagged address"
        description="This address is blocked."
        actionLabel="Learn more"
        onAction={onAction}
        testID="sanctioned-address-banner"
      />,
    );

    expect(screen.getByTestId("sanctioned-address-banner")).toBeVisible();
    expect(screen.getByText("This address is blocked.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
