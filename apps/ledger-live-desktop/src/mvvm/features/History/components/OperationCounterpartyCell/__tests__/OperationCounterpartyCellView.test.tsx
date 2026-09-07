import React from "react";
import { render, screen } from "tests/testSetup";
import { OperationCounterpartyCellView } from "../OperationCounterpartyCellView";

describe("OperationCounterpartyCellView", () => {
  it("should render the prefixed counterparty name above the contact address label", () => {
    render(
      <OperationCounterpartyCellView
        displayName="Ben"
        contactAddressLabel="USDT Coinbase"
        prefix="To"
      />,
    );

    expect(screen.getByText("To")).toBeVisible();
    expect(screen.getByText("Ben")).toBeVisible();
    expect(screen.getByText("USDT Coinbase")).toBeVisible();
  });

  it("should render no label line when the counterparty is not a contact", () => {
    render(<OperationCounterpartyCellView displayName="0xdead...0000" prefix="To" />);

    expect(screen.getByText("0xdead...0000")).toBeVisible();
    expect(screen.queryByText("USDT Coinbase")).not.toBeInTheDocument();
  });

  it("should keep the trailing content when there is no address to display", () => {
    render(
      <OperationCounterpartyCellView displayName="" prefix="To">
        <span>icon</span>
      </OperationCounterpartyCellView>,
    );

    expect(screen.getByText("icon")).toBeVisible();
    expect(screen.queryByText("To")).not.toBeInTheDocument();
  });
});
