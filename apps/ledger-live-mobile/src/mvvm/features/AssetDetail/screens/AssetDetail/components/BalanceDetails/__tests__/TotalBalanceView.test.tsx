import React from "react";
import { render, screen } from "@tests/test-renderer";
import { TotalBalanceView } from "../TotalBalanceView";

const baseProps = {
  discreet: false,
  counterValueFormatter: jest.fn(),
  formattedTotalBalance: "1 BTC",
  onTransferPress: jest.fn(),
};

describe("TotalBalanceView", () => {
  it("shows unavailable fiat while keeping the crypto balance visible", () => {
    render(<TotalBalanceView {...baseProps} counterValue={undefined} />);

    expect(screen.getByTestId("asset-total-unavailable")).toHaveTextContent("-");
    expect(screen.getByText("1 BTC")).toBeVisible();
  });
});
