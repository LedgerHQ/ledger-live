import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DepositOptionCard, DepositOptionIcon } from "../DepositOptionParts.web";

describe("DepositOptionParts (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("selects the option when the card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <DepositOptionCard optionId="swap" onSelect={onSelect}>
        <DepositOptionIcon optionId="swap" />
      </DepositOptionCard>,
    );

    await user.click(screen.getByTestId("pay-card-deposit-option-swap"));

    expect(onSelect).toHaveBeenCalledWith("swap");
  });
});
