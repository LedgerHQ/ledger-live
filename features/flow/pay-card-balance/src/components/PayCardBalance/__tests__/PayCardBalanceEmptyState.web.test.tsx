import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { PayCardBalanceEmptyState } from "../PayCardBalanceEmptyState.web";

describe("PayCardBalanceEmptyState (Web)", () => {
  it("should render the empty title and description", () => {
    render(
      <StyleProvider colorScheme="dark">
        <PayCardBalanceEmptyState
          labels={{
            emptyTitle: "Pay and get paid",
            emptyDescription: "Start by depositing stablecoin to your wallet",
          }}
        />
      </StyleProvider>,
    );

    expect(screen.getByTestId("pay-card-balance-empty-state")).toBeVisible();
    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });
});
