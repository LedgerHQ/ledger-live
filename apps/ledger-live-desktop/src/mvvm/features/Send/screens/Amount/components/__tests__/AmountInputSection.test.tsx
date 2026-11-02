/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import { AmountInputSection } from "../AmountInputSection";

function renderAmountInputSection(isFiatModeAvailable: boolean) {
  return render(
    <AmountInputSection
      amountValue=""
      amountInputMaxDecimalLength={8}
      currencyText="ETH"
      currencyPosition="right"
      isInputDisabled={false}
      onAmountChange={jest.fn()}
      onToggleInputMode={jest.fn()}
      toggleLabel="Switch"
      isFiatModeAvailable={isFiatModeAvailable}
      secondaryValue="$0.00"
      amountMessage={null}
    />,
  );
}

describe("AmountInputSection", () => {
  it("shows the input mode toggle and the secondary value when fiat is available", () => {
    renderAmountInputSection(true);

    expect(screen.getByTestId("send-toggle-input-mode-button")).toBeInTheDocument();
    expect(screen.getByTestId("send-amount-secondary-value")).toHaveTextContent("$0.00");
  });

  it("hides the input mode toggle and the secondary value when fiat is not available", () => {
    renderAmountInputSection(false);

    expect(screen.getByTestId("send-amount-input")).toBeInTheDocument();
    expect(screen.queryByTestId("send-toggle-input-mode-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-amount-secondary-value")).not.toBeInTheDocument();
  });
});
