import React from "react";
import { render, screen } from "@tests/test-renderer";
import { Trend } from "../index";

describe("Trend", () => {
  it.each([0, NaN])("renders a dash when percentage is %s", percentage => {
    render(<Trend percentage={percentage} />);

    expect(screen.getByText("−")).toBeVisible();
  });

  it("renders positive percentage with up indicator", () => {
    render(<Trend percentage={7.87} testID="trend" />);

    expect(screen.getByText("7.87%")).toBeVisible();
    expect(screen.getByTestId("trend-icon-up")).toBeVisible();
    expect(screen.queryByTestId("trend-icon-down")).toBeNull();
  });

  it("renders negative percentage with down indicator", () => {
    render(<Trend percentage={-18.81} testID="trend" />);

    expect(screen.getByText("18.81%")).toBeVisible();
    expect(screen.getByTestId("trend-icon-down")).toBeVisible();
    expect(screen.queryByTestId("trend-icon-up")).toBeNull();
  });

  it("renders all parts together", () => {
    render(
      <Trend percentage={-5.12} formattedChange="-$500.00" timeLabel="1 week" testID="trend" />,
    );

    expect(screen.getByTestId("trend")).toBeVisible();
    expect(screen.getByTestId("trend-icon-down")).toBeVisible();
    expect(screen.getByText("5.12%")).toBeVisible();
    expect(screen.getByText("-$500.00")).toBeVisible();
    expect(screen.getByText("1 week")).toBeVisible();
    expect(screen.getByText("·")).toBeVisible();
  });

  it("does not render formattedChange when undefined", () => {
    render(<Trend percentage={3.0} timeLabel="1 month" />);

    expect(screen.getByText("3.00%")).toBeVisible();
    expect(screen.getByText("1 month")).toBeVisible();
    expect(screen.queryByText("+")).toBeNull();
  });

  it("does not render timeLabel when undefined", () => {
    render(<Trend percentage={1.0} formattedChange="+$10.00" />);

    expect(screen.getByText("1.00%")).toBeVisible();
    expect(screen.getByText("+$10.00")).toBeVisible();
    expect(screen.queryByText("·")).toBeNull();
  });
});
