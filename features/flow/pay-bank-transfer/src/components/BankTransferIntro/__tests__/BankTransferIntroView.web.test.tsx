import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { trackedPages } from "@features/platform-pay-analytics/testing/module-mock";
import { BankTransferIntroView } from "../BankTransferIntroView.web";
import type { BankTransferIntroViewProps } from "../../../types";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

const defaultProps: BankTransferIntroViewProps = {
  isOpen: true,
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
  onCreateAccountPress: jest.fn(),
  onLogInPress: jest.fn(),
  onClosePress: jest.fn(),
  onDismiss: jest.fn(),
};

function renderIntro(props: Partial<BankTransferIntroViewProps> = {}) {
  return render(<BankTransferIntroView {...defaultProps} {...props} />);
}

describe("BankTransferIntroView (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("tracks the cash to stable feature intro page while open", () => {
    renderIntro();

    expect(trackedPages()).toContainEqual({
      page: "Feature Intro",
      name: "Cash to stable",
      flow: "Cash to stable",
    });
  });

  it("does not track the page while closed", () => {
    renderIntro({ isOpen: false });

    expect(trackedPages()).toHaveLength(0);
  });

  it("creates an account once even if the CTA is clicked repeatedly", () => {
    const onCreateAccountPress = jest.fn();
    renderIntro({ onCreateAccountPress });

    fireEvent.click(screen.getByTestId("pay-bank-transfer-intro-create-account"));
    fireEvent.click(screen.getByTestId("pay-bank-transfer-intro-create-account"));

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
  });
});
