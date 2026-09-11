import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BankTransferIntroView } from "../BankTransferIntroView.web";
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

describe("BankTransferIntroView (Web)", () => {
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

  it("creates an account once even if the CTA is clicked repeatedly", () => {
    const onCreateAccountPress = jest.fn();
    render(<BankTransferIntroView {...defaultProps} onCreateAccountPress={onCreateAccountPress} />);

    fireEvent.click(screen.getByTestId("pay-bank-transfer-intro-create-account"));
    fireEvent.click(screen.getByTestId("pay-bank-transfer-intro-create-account"));

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
  });
});
