import React from "react";
import { render, screen } from "@testing-library/react-native";
import { BalanceEmptyState } from "../components/Hero/BalanceEmptyState.native";
import { emptyLabels } from "./fixtures";

describe("BalanceEmptyState (Native)", () => {
  it("should render the empty title and description", () => {
    render(<BalanceEmptyState labels={emptyLabels} />);

    expect(screen.getByTestId("pay-card-balance-empty-state")).toBeTruthy();
    expect(screen.getByText("Pay and get paid")).toBeTruthy();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeTruthy();
  });
});
