import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppUnavailable } from "./AppUnavailable";

const TITLE = "Ledger Wallet is currently unavailable";
const DESCRIPTION = "This does not impact your assets. Please try again later.";
const ACTION_LABEL = "Learn more";

describe("AppUnavailable", () => {
  it("should show the title and description", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.getByRole("heading", { name: TITLE })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it("should not render an action when none is provided", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should render the action and call onSelect when selected", () => {
    const onSelect = jest.fn();

    render(
      <AppUnavailable
        title={TITLE}
        description={DESCRIPTION}
        action={{ label: ACTION_LABEL, onSelect, testID: "app-unavailable-action" }}
      />,
    );

    const button = screen.getByRole("button", { name: ACTION_LABEL });
    expect(button).toBeVisible();
    expect(screen.getByTestId("app-unavailable-action")).toBeVisible();

    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
