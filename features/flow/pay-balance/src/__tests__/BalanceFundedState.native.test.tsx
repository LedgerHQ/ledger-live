import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { BalanceFundedState } from "../components/Hero/BalanceFundedState.native";
import { fundedStateProps } from "./fixtures";

describe("BalanceFundedState (Native)", () => {
  it("should render the funded balance and the filter select", () => {
    render(<BalanceFundedState {...fundedStateProps} />);

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeTruthy();
  });

  it("should open the filter when the select is pressed", async () => {
    const user = userEvent.setup();
    const onOpenFilter = jest.fn();
    render(<BalanceFundedState {...fundedStateProps} onOpenFilter={onOpenFilter} />);

    await user.press(screen.getByTestId("pay-card-balance-filter-pill"));

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });
});
