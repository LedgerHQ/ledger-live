import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { BankTransferIntroView } from "../BankTransferIntroView.native";
import type { BankTransferIntroViewProps } from "../../../types";

const defaultProps: BankTransferIntroViewProps = {
  isOpen: true,
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
  bottomInset: 0,
  onShown: jest.fn(),
  onCreateAccountPress: jest.fn(),
  onLogInPress: jest.fn(),
  onClosePress: jest.fn(),
  onDismiss: jest.fn(),
};

describe("BankTransferIntroView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("signals it was shown once across re-renders", () => {
    const onShown = jest.fn();
    const { rerender } = render(<BankTransferIntroView {...defaultProps} onShown={onShown} />);

    rerender(<BankTransferIntroView {...defaultProps} onShown={onShown} />);

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("does not signal it was shown while closed", () => {
    const onShown = jest.fn();
    render(<BankTransferIntroView {...defaultProps} isOpen={false} onShown={onShown} />);

    expect(onShown).not.toHaveBeenCalled();
  });

  it("keeps the sheet content node mounted but hides copy while closed", () => {
    render(<BankTransferIntroView {...defaultProps} isOpen={false} />);

    expect(screen.getByTestId("pay-bank-transfer-intro-content")).toBeTruthy();
    expect(screen.queryByText("Convert cash to stablecoins")).toBeNull();
  });

  it("renders the intro copy when open", () => {
    render(<BankTransferIntroView {...defaultProps} />);

    expect(screen.getByText("Convert cash to stablecoins")).toBeTruthy();
    expect(screen.getByLabelText("Create an account")).toBeTruthy();
  });

  it("reserves the bottom safe area so the CTA stays visible", () => {
    render(<BankTransferIntroView {...defaultProps} bottomInset={48} />);

    const content = screen.getByTestId("pay-bank-transfer-intro-content");
    expect(content.props.style.paddingBottom).toBeGreaterThanOrEqual(48);
  });

  it("creates an account once even if the CTA is pressed repeatedly", () => {
    const onCreateAccountPress = jest.fn();
    render(<BankTransferIntroView {...defaultProps} onCreateAccountPress={onCreateAccountPress} />);

    const cta = screen.getByLabelText("Create an account");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
  });
});
