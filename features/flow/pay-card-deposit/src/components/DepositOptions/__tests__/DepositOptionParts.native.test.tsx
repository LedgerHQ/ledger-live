import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { DepositOptionCard, DepositOptionIcon } from "../DepositOptionParts.native";

describe("DepositOptionParts (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("selects the option when the card is pressed", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <DepositOptionCard optionId="swap" onSelect={onSelect}>
        <DepositOptionIcon optionId="swap" />
      </DepositOptionCard>,
    );

    await user.press(screen.getByTestId("pay-card-deposit-option-swap"));

    expect(onSelect).toHaveBeenCalledWith("swap");
  });
});
