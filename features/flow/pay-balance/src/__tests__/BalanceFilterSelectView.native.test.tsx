import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { BalanceFilterSelectView } from "../components/Filter/BalanceFilterSelectView.native";
import { usdcOption } from "./fixtures";

describe("BalanceFilterSelectView (Native)", () => {
  it("should render the label and call onPress", () => {
    const onPress = jest.fn();
    render(<BalanceFilterSelectView label="All stablecoins" onPress={onPress} />);

    const pill = screen.getByTestId("pay-card-balance-filter-pill");
    expect(pill).toBeTruthy();
    expect(screen.getByText("All stablecoins")).toBeTruthy();

    fireEvent.press(pill);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("should render the selected coin ticker", () => {
    render(
      <BalanceFilterSelectView
        label="USDC"
        ledgerId={usdcOption.ledgerId}
        ticker="USDC"
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("USDC")).toBeTruthy();
  });
});
