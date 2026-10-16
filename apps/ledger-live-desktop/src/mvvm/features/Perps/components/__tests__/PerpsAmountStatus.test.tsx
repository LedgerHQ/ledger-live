import React from "react";
import { render, screen } from "tests/testSetup";
import { PerpsAmountStatus } from "../PerpsAmountStatus";

const baseProps = {
  quotedAmountText: "Deposit ~0.3 ETH",
  isQuoteLoading: false,
  notice: "Swap and deposit via SwapKit",
  errorMessage: null,
  testIdPrefix: "perps-test",
};

describe("PerpsAmountStatus", () => {
  it("shows the quoted amount and the notice", () => {
    render(<PerpsAmountStatus {...baseProps} />);

    expect(screen.getByText("Deposit ~0.3 ETH")).toBeVisible();
    expect(screen.getByText("Swap and deposit via SwapKit")).toBeVisible();
  });

  it("shows a skeleton while the quote loads", () => {
    render(<PerpsAmountStatus {...baseProps} isQuoteLoading />);

    expect(screen.getByTestId("perps-test-quote-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Deposit ~0.3 ETH")).not.toBeInTheDocument();
  });

  it("shows the error instead of the notice", () => {
    render(<PerpsAmountStatus {...baseProps} errorMessage="Insufficient balance" />);

    expect(screen.getByTestId("perps-test-form-error")).toHaveTextContent("Insufficient balance");
    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeInTheDocument();
  });

  it("renders nothing for an empty quote and no notice", () => {
    render(<PerpsAmountStatus {...baseProps} quotedAmountText={null} notice={null} />);

    expect(screen.queryByText("Deposit ~0.3 ETH")).not.toBeInTheDocument();
    expect(screen.queryByText("Swap and deposit via SwapKit")).not.toBeInTheDocument();
  });
});
