import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { DepositOptionsView } from "../DepositOptionsView.native";

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

describe("DepositOptionsView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render(<DepositOptionsView {...defaultProps} isOpen={false} />);

    const sheet = screen.getByTestId("pay-card-deposit-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-card-deposit-options")).toBeNull();
  });

  it("requests the sheet to open and renders its options when open", () => {
    render(<DepositOptionsView {...defaultProps} />);

    const sheet = screen.getByTestId("pay-card-deposit-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByTestId("pay-card-deposit-options")).toBeVisible();
    expect(screen.getByTestId("pay-card-deposit-option-swap")).toBeVisible();
  });

  it("reserves the bottom safe area so the last option stays visible", () => {
    render(<DepositOptionsView {...defaultProps} bottomInset={48} />);

    const content = screen.getByTestId("pay-card-deposit-sheet-content");
    expect(content.props.style.paddingBottom).toBeGreaterThanOrEqual(48);
  });

  it("emits the pressed option id", async () => {
    const user = userEvent.setup();
    const onSelectOption = jest.fn();
    render(<DepositOptionsView {...defaultProps} onSelectOption={onSelectOption} />);

    await user.press(screen.getByTestId("pay-card-deposit-option-receive"));

    expect(onSelectOption).toHaveBeenCalledWith("receive");
  });
});
