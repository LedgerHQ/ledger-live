import React from "react";
import { render, screen } from "@testing-library/react-native";
import { PayCardBalanceEmptyState } from "../PayCardBalanceEmptyState.native";

describe("PayCardBalanceEmptyState (Native)", () => {
  it("should render the empty title and description", () => {
    render(
      <PayCardBalanceEmptyState
        labels={{
          emptyTitle: "Pay and get paid",
          emptyDescription: "Start by depositing stablecoin to your wallet",
        }}
      />,
    );

    expect(screen.getByTestId("pay-card-balance-empty-state")).toBeTruthy();
    expect(screen.getByText("Pay and get paid")).toBeTruthy();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeTruthy();
  });
});
