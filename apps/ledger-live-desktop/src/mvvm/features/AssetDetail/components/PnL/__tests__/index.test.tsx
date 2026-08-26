import React from "react";
import { render, screen } from "tests/testSetup";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { PnLSection } from "../index";

jest.mock("../PnLSection", () => ({
  PnLSection: () => <div data-testid="asset-detail-pnl-content" />,
}));

describe("PnLSection", () => {
  it("hides PnL when a positive asset has no current countervalue", () => {
    const distributionItem = buildDistributionItem({
      amount: 100_000_000,
      countervalue: undefined,
    });

    render(<PnLSection distributionItem={distributionItem} isLoading={false} />);

    expect(screen.queryByTestId("asset-detail-pnl-content")).not.toBeInTheDocument();
  });

  it("keeps a real zero valuation available", () => {
    const distributionItem = buildDistributionItem({ amount: 0, countervalue: 0 });

    render(<PnLSection distributionItem={distributionItem} isLoading={false} />);

    expect(screen.getByTestId("asset-detail-pnl-content")).toBeVisible();
  });
});
