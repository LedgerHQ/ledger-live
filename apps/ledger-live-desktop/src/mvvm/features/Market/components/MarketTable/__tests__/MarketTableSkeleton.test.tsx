import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketTableSkeleton } from "../MarketTableSkeleton";

describe("MarketTableSkeleton", () => {
  it("should render the skeleton container", () => {
    render(<MarketTableSkeleton />);
    expect(screen.getByTestId("market-table-skeleton")).toBeVisible();
  });

  it("should render 12 skeleton rows", () => {
    render(<MarketTableSkeleton />);
    const skeleton = screen.getByTestId("market-table-skeleton");
    expect(skeleton.children).toHaveLength(12);
  });
});
