import React from "react";
import { render, screen } from "tests/testSetup";
import { createMockMarketPerformer } from "@ledgerhq/live-common/market/utils/fixtures";
import { PerformanceIndicator } from "../components/PerformanceIndicator";

describe("PerformanceIndicator", () => {
  it("should render positive percentage with + sign and success color", () => {
    const item = createMockMarketPerformer({ priceChangePercentage24h: 5.234 });
    const { container } = render(<PerformanceIndicator item={item} />);

    expect(screen.getByText("+5.23%")).toBeVisible();
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("should render negative percentage without + sign and error color", () => {
    const item = createMockMarketPerformer({ priceChangePercentage24h: -3.456 });
    const { container } = render(<PerformanceIndicator item={item} />);

    expect(screen.getByText("-3.46%")).toBeVisible();
    expect(container.firstChild).toHaveClass("text-error");
  });

  it("should render zero percentage with + sign and neutral color", () => {
    const item = createMockMarketPerformer({ priceChangePercentage24h: 0 });
    const { container } = render(<PerformanceIndicator item={item} />);

    expect(screen.getByText("+0.00%")).toBeVisible();
    expect(container.firstChild).toHaveClass("text-muted");
  });

  it("should format percentage to 2 decimal places", () => {
    const item = createMockMarketPerformer({ priceChangePercentage24h: 12.3456789 });
    render(<PerformanceIndicator item={item} />);

    expect(screen.getByText("+12.35%")).toBeVisible();
  });
});
