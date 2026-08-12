import React from "react";
import { render, screen } from "@testing-library/react-native";
import { PayCardBalanceEmptyState } from "../PayCardBalanceEmptyState.native";
import { emptyLabels } from "./fixtures";

describe("PayCardBalanceEmptyState (Native)", () => {
  it("should render the empty title and description", () => {
    render(<PayCardBalanceEmptyState labels={emptyLabels} />);

    expect(screen.getByTestId("pay-card-balance-empty-state")).toBeTruthy();
    expect(screen.getByText("Pay and get paid")).toBeTruthy();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeTruthy();
  });
});
