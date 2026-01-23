import React from "react";
import { render, screen } from "tests/testSetup";
import { QuickActionsView } from "../index";

describe("QuickActions", () => {
  it("renders nothing when user has no accounts", () => {
    const { container } = render(<QuickActionsView hasAccount={false} actionsList={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders ActionsList when user has accounts", () => {
    render(<QuickActionsView hasAccount={true} actionsList={[]} />);
    expect(screen.getByTestId("quick-actions-actions-list")).toBeVisible();
  });
});
