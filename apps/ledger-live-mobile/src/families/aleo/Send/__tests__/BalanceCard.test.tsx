import React from "react";
import { render, screen } from "@tests/test-renderer";
import { BalanceCard } from "../BalanceCard";

describe("BalanceCard", () => {
  it("renders label and balance", () => {
    render(<BalanceCard label="Public" balance="100 ALEO" selected={false} onPress={() => {}} />);

    expect(screen.getByText("Public")).toBeOnTheScreen();
    expect(screen.getByText("100 ALEO")).toBeOnTheScreen();
  });

  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    const { user } = render(
      <BalanceCard label="Public" balance="100 ALEO" selected={false} onPress={onPress} />,
    );

    await user.press(screen.getByText("Public"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders lastUpdateLabel when provided", () => {
    render(
      <BalanceCard
        label="Private"
        balance="***"
        selected={true}
        onPress={() => {}}
        lastUpdateLabel="Last update: recently"
      />,
    );

    expect(screen.getByText("Last update: recently")).toBeOnTheScreen();
  });
});
