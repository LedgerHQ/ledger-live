import BigNumber from "bignumber.js";
import React from "react";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { render, screen } from "tests/testSetup";
import { aleoCurrency } from "../../../__mocks__/currency.mock";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";
import StepSummaryAmountRow from "./StepSummaryAmountRow";

describe("StepSummaryAmountRow", () => {
  it("should render amount row with private label for private transfer", () => {
    render(
      <StepSummaryAmountRow
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
        amount={new BigNumber(10)}
        unit={aleoCurrency.units[0]}
        currency={aleoCurrency}
      />,
    );

    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Private")).toBeInTheDocument();
    expect(screen.getByTestId("transaction-amount")).toBeInTheDocument();
  });

  it("should render amount row with public label for public transfer", () => {
    render(
      <StepSummaryAmountRow
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC })}
        amount={new BigNumber(10)}
        unit={aleoCurrency.units[0]}
        currency={aleoCurrency}
      />,
    );

    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByTestId("transaction-amount")).toBeInTheDocument();
  });
});
