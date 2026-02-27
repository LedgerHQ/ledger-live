import React from "react";
import { render, screen } from "tests/testSetup";
import { TrendCell } from "../TrendCell";

describe("TrendCell", () => {
  it("should display '-' when priceChangePercentage24h is undefined", () => {
    render(<TrendCell priceChangePercentage24h={undefined} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("should display formatted positive percentage with + prefix", () => {
    render(<TrendCell priceChangePercentage24h={2.3} />);

    expect(screen.getByText("+2.30%")).toBeInTheDocument();
  });

  it("should display formatted negative percentage without prefix", () => {
    render(<TrendCell priceChangePercentage24h={-1.5} />);

    expect(screen.getByText("-1.50%")).toBeInTheDocument();
  });

  it("should apply success color class for positive percentage", () => {
    render(<TrendCell priceChangePercentage24h={2.3} />);

    expect(screen.getByText("+2.30%")).toHaveClass("text-success");
  });

  it("should apply error color class for negative percentage", () => {
    render(<TrendCell priceChangePercentage24h={-1.5} />);

    expect(screen.getByText("-1.50%")).toHaveClass("text-error");
  });

  it("should display +0.00% with success color for zero percentage", () => {
    render(<TrendCell priceChangePercentage24h={0} />);

    expect(screen.getByText("+0.00%")).toBeInTheDocument();
    expect(screen.getByText("+0.00%")).toHaveClass("text-success");
  });
});
