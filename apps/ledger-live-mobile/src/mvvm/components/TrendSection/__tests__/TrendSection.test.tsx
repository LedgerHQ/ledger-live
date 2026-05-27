import React from "react";
import { render, screen } from "@tests/test-renderer";
import { TrendSection } from "../index";

describe("TrendSection", () => {
  it.each([0, NaN])("renders a dash when percentage is %s", percentage => {
    render(<TrendSection percentage={percentage} />);

    expect(screen.getByText("−")).toBeVisible();
  });

  it("renders positive percentage", () => {
    render(<TrendSection percentage={7.87} testID="trend" />);

    expect(screen.getByText("7.87%")).toBeVisible();
  });

  it("renders negative percentage with minus sign", () => {
    render(<TrendSection percentage={-18.81} testID="trend" />);

    expect(screen.getByText("-18.81%")).toBeVisible();
  });

  it("renders all parts together", () => {
    render(
      <TrendSection
        percentage={-5.12}
        formattedChange="-$500.00"
        timeLabel="1 week"
        testID="trend"
      />,
    );

    expect(screen.getByTestId("trend")).toBeVisible();
    expect(screen.getByText("-5.12%")).toBeVisible();
    expect(screen.getByText("-$500.00")).toBeVisible();
    expect(screen.getByText("1 week")).toBeVisible();
    expect(screen.getByText("·")).toBeVisible();
  });

  it("does not render formattedChange when undefined", () => {
    render(<TrendSection percentage={3.0} timeLabel="1 month" />);

    expect(screen.getByText("3.00%")).toBeVisible();
    expect(screen.getByText("1 month")).toBeVisible();
  });

  it("does not render timeLabel when undefined", () => {
    render(<TrendSection percentage={1.0} formattedChange="+$10.00" />);

    expect(screen.getByText("1.00%")).toBeVisible();
    expect(screen.getByText("+$10.00")).toBeVisible();
    expect(screen.queryByText("·")).toBeNull();
  });
});
