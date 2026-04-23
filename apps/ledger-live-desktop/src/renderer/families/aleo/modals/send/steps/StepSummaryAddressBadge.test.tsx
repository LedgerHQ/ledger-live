import React from "react";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import { render, screen } from "tests/testSetup";
import StepSummaryAddressBadge from "./StepSummaryAddressBadge";
import { makeAleoTransaction } from "../../../__mocks__/transaction.mock";

describe("StepSummaryAddressBadge", () => {
  it("should render a private badge for private from transactions", () => {
    render(
      <StepSummaryAddressBadge
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PRIVATE })}
        direction="from"
      />,
    );

    expect(screen.getByText("Private")).toBeInTheDocument();
  });

  it("should render a public badge for public from transactions", () => {
    render(
      <StepSummaryAddressBadge
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.TRANSFER_PUBLIC })}
        direction="from"
      />,
    );

    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("should render a private badge for private to transactions", () => {
    render(
      <StepSummaryAddressBadge
        transaction={makeAleoTransaction({ mode: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE })}
        direction="to"
      />,
    );

    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});
