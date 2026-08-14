import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { PayCardBalanceFundedState } from "../components/Hero/PayCardBalanceFundedState.native";
import { depositActionTiles, fundedStateProps } from "./fixtures";

describe("PayCardBalanceFundedState (Native)", () => {
  it("should render the funded balance and the filter select", () => {
    render(<PayCardBalanceFundedState {...fundedStateProps} />);

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeTruthy();
  });

  it("should open the filter when the select is pressed", async () => {
    const user = userEvent.setup();
    const onOpenFilter = jest.fn();
    render(<PayCardBalanceFundedState {...fundedStateProps} onOpenFilter={onOpenFilter} />);

    await user.press(screen.getByTestId("pay-card-balance-filter-pill"));

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });

  it("should render the action tiles when provided", () => {
    render(<PayCardBalanceFundedState {...fundedStateProps} actionTiles={depositActionTiles} />);

    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
  });
});
