import React from "react";
import { render, screen } from "tests/testSetup";
import MainFooter from "../index";

describe("MainFooter", () => {
  it("should render the accept analytics button", () => {
    render(<MainFooter onShareAnalyticsChange={jest.fn()} />);

    expect(screen.getByRole("button", { name: "Accept all" })).toBeVisible();
  });

  it("should call onShareAnalyticsChange when accept is clicked", async () => {
    const onShareAnalyticsChange = jest.fn();
    const { user } = render(<MainFooter onShareAnalyticsChange={onShareAnalyticsChange} />);

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    expect(onShareAnalyticsChange).toHaveBeenCalledWith(true);
  });

  it("should call onShareAnalyticsChange with false when refuse is clicked", async () => {
    const onShareAnalyticsChange = jest.fn();
    const { user } = render(<MainFooter onShareAnalyticsChange={onShareAnalyticsChange} />);

    await user.click(screen.getByRole("button", { name: "Refuse all" }));

    expect(onShareAnalyticsChange).toHaveBeenCalledWith(false);
  });
});
