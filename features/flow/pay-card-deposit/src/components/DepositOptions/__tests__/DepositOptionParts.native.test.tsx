import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { DepositOptionIcon, DepositOptionListItem } from "../DepositOptionParts.native";

describe("DepositOptionParts (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("selects the option when the list item is pressed", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <DepositOptionListItem optionId="swap" onSelect={onSelect}>
        <DepositOptionIcon optionId="swap" />
      </DepositOptionListItem>,
    );

    await user.press(screen.getByTestId("pay-card-deposit-option-swap"));

    expect(onSelect).toHaveBeenCalledWith("swap");
  });
});
