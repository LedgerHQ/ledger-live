import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AppUnavailable } from "./AppUnavailable";

const TITLE = "Ledger Wallet is currently unavailable";
const DESCRIPTION = "This does not impact your assets. Please try again later.";
const ACTION_LABEL = "Learn more";

describe("AppUnavailable", () => {
  it("should show the title and description", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.getByRole("header", { name: TITLE })).toBeVisible();
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it("should not render an action when none is provided", () => {
    render(<AppUnavailable title={TITLE} description={DESCRIPTION} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("should render the action and call onOpenLearnMore when selected", () => {
    const onOpenLearnMore = jest.fn();

    render(
      <AppUnavailable
        title={TITLE}
        description={DESCRIPTION}
        action={{ label: ACTION_LABEL, onOpenLearnMore, testID: "app-unavailable-action" }}
      />,
    );

    const button = screen.getByTestId("app-unavailable-action");
    expect(button).toBeVisible();
    expect(screen.getByText(ACTION_LABEL)).toBeVisible();

    fireEvent.press(button);

    expect(onOpenLearnMore).toHaveBeenCalledTimes(1);
  });
});
