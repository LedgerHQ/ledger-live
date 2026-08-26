import React from "react";
import { render, screen } from "tests/testSetup";
import { mockCounterValue } from "LLD/hooks/__tests__/fixtures";
import { BalanceDiff, BalanceTotal } from "./index";

const unit = mockCounterValue.units[0];

describe("BalanceInfos", () => {
  it("should show an unavailable total instead of zero after an incomplete calculation", () => {
    render(<BalanceTotal unit={unit} totalBalance={0} isAvailable countervalueComplete={false} />);

    expect(screen.getByTestId("total-balance-unavailable")).toHaveTextContent("-");
    expect(screen.queryByTestId("total-balance")).not.toBeInTheDocument();
  });

  it("should preserve a true zero total when countervalues are complete", () => {
    render(<BalanceTotal unit={unit} totalBalance={0} isAvailable countervalueComplete />);

    expect(screen.getByTestId("total-balance")).toBeVisible();
    expect(screen.queryByTestId("total-balance-unavailable")).not.toBeInTheDocument();
  });

  it("should show an unavailable trend after an incomplete calculation", () => {
    render(
      <BalanceDiff
        unit={unit}
        totalBalance={0}
        isAvailable
        countervalueComplete={false}
        valueChange={{ value: 0, percentage: null }}
      />,
    );

    expect(screen.getByTestId("balance-diff-unavailable")).toHaveTextContent("-");
    expect(screen.queryByTestId("balance-diff")).not.toBeInTheDocument();
  });
});
