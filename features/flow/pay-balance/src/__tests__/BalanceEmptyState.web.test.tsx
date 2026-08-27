import React from "react";
import { screen } from "@testing-library/react";
import { BalanceEmptyState } from "../components/Hero/BalanceEmptyState.web";
import { renderWithStyle } from "./renderWithStyle.web";

describe("BalanceEmptyState (Web)", () => {
  it("should render the empty title and description", () => {
    renderWithStyle(
      <BalanceEmptyState
        labels={{
          emptyTitle: "Pay and get paid",
          emptyDescription: "Start by depositing stablecoin to your wallet",
        }}
      />,
    );

    expect(screen.getByTestId("pay-card-balance-empty-state")).toBeVisible();
    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });
});
