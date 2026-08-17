import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DepositOptionsView } from "../DepositOptionsView.web";

const defaultProps: React.ComponentProps<typeof DepositOptionsView> = {
  isOpen: true,
  title: "Deposit stablecoin",
  options: [
    { id: "bankTransfer", title: "Bank transfer", description: "From your bank account" },
    { id: "swap", title: "Swap", description: "From your crypto" },
    { id: "receive", title: "Receive", description: "From another wallet" },
    { id: "buy", title: "Buy", description: "With card or bank" },
  ],
  onClose: jest.fn(),
  onSelectOption: jest.fn(),
};

describe("DepositOptionsView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the four options when open", () => {
    render(<DepositOptionsView {...defaultProps} />);

    expect(screen.getByTestId("pay-card-deposit-options")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-bankTransfer")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-swap")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-receive")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-buy")).toBeVisible();
  });

  it("renders nothing when closed", () => {
    render(<DepositOptionsView {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("pay-card-deposit-options")).toBeNull();
  });

  it("emits the pressed option id", async () => {
    const user = userEvent.setup();
    const onSelectOption = jest.fn();
    render(<DepositOptionsView {...defaultProps} onSelectOption={onSelectOption} />);

    await user.click(screen.getByTestId("pay-card-deposit-option-buy"));

    expect(onSelectOption).toHaveBeenCalledWith("buy");
  });
});
