import React from "react";
import { render, screen } from "tests/testSetup";
import QuickActions from "../index";

describe("QuickActions", () => {
  it("renders nothing when user has no accounts", () => {
    const { container } = render(<QuickActions hasAccount={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders ActionsList when user has accounts", () => {
    render(<QuickActions hasAccount={true} />);
    expect(screen.getByTestId("quick-actions-actions-list")).toBeVisible();
  });
});
