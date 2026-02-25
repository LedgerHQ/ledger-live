import React from "react";
import { render, screen } from "tests/testSetup";
import { PerformanceIndicator } from "../components/PerformanceIndicator";

describe("PerformanceIndicator", () => {
  it("should render positive percentage with + sign and success color", () => {
    const value = { priceChangePercentage24h: 5.234 };
    const { container } = render(<PerformanceIndicator value={value} />);

    expect(screen.getByText("+5.23%")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("should render negative percentage without + sign and error color", () => {
    const value = { priceChangePercentage24h: -3.456 };
    const { container } = render(<PerformanceIndicator value={value} />);

    expect(screen.getByText("-3.46%")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-error");
  });

  it("should render zero percentage with + sign and success color", () => {
    const value = { priceChangePercentage24h: 0 };
    const { container } = render(<PerformanceIndicator value={value} />);

    expect(screen.getByText("+0.00%")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("should format percentage to 2 decimal places", () => {
    const value = { priceChangePercentage24h: 12.3456789 };
    render(<PerformanceIndicator value={value} />);

    expect(screen.getByText("+12.35%")).toBeInTheDocument();
  });
});
