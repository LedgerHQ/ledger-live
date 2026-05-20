import React from "react";
import { render, screen } from "tests/testSetup";
import { BigNumber } from "bignumber.js";
import { AggregatedAccountValueCell } from "../AggregatedAccountValueCell";

describe("AggregatedAccountValueCell", () => {
  it("renders only the formatted counter value amount", () => {
    render(<AggregatedAccountValueCell aggregatedCountervalue={new BigNumber(100000)} />);

    expect(screen.getByText(/1,000\.00/)).toBeVisible();
    expect(screen.queryByText(/asset/)).not.toBeInTheDocument();
  });
});
