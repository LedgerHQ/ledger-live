import React from "react";
import { render, screen } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import { AggregatedAccountValueCell } from "../AggregatedAccountValueCell";

describe("AggregatedAccountValueCell", () => {
  it('renders the formatted counter value amount and "1 asset" when assetsCount is 1', () => {
    render(
      <AggregatedAccountValueCell aggregatedCountervalue={new BigNumber(100000)} assetsCount={1} />,
    );

    expect(screen.getByText("1 asset")).toBeVisible();
    expect(screen.getByText(/1,000\.00/)).toBeVisible();
  });

  it('renders the formatted counter value amount and "3 assets" when assetsCount is 3', () => {
    render(
      <AggregatedAccountValueCell aggregatedCountervalue={new BigNumber(500000)} assetsCount={3} />,
    );

    expect(screen.getByText("3 assets")).toBeVisible();
    expect(screen.getByText(/5,000\.00/)).toBeVisible();
  });

  it('renders "0 asset" (singular) when assetsCount is 0', () => {
    render(
      <AggregatedAccountValueCell aggregatedCountervalue={new BigNumber(0)} assetsCount={0} />,
    );

    expect(screen.getByText("0 asset")).toBeVisible();
  });
});
