import React from "react";
import { render, screen } from "tests/testSetup";
import { PnlSubHeader } from "../PnlSubHeader";

describe("PnlSubHeader", () => {
  it("renders the section title and details link", () => {
    render(<PnlSubHeader onDetailClick={jest.fn()} />);

    expect(screen.getByText("Profit and loss")).toBeVisible();
    expect(screen.getByText("Details")).toBeVisible();
  });

  it("calls onDetailClick when the details link is clicked", async () => {
    const onDetailClick = jest.fn();
    const { user } = render(<PnlSubHeader onDetailClick={onDetailClick} />);

    await user.click(screen.getByText("Details"));

    expect(onDetailClick).toHaveBeenCalledTimes(1);
  });
});
