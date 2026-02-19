import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import StepCreateFooter from "../StepCreateFooter";
import { StepProps } from "../../types";
import {
  createMockConcordiumCurrency,
  createMockDevice,
  createMockAccount,
  createMockImportableAccount,
  createMockStepProps,
} from "../../__tests__/testUtils";

describe("StepCreateFooter", () => {
  const mockCurrency = createMockConcordiumCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockImportableAccount = createMockImportableAccount();

  const defaultProps: StepProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    creatableAccount: mockAccount,
    importableAccounts: [mockImportableAccount],
    onboardingStatus: AccountOnboardStatus.PREPARE,
    confirmationCode: "ABCD",
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render continue button in SUCCESS state", () => {
    render(<StepCreateFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.SUCCESS} />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeInTheDocument();
  });

  it("should render try again button in ERROR state", () => {
    render(<StepCreateFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.ERROR} />);

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeInTheDocument();
  });

  it("should not render action button in PREPARE state", () => {
    render(<StepCreateFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.PREPARE} />);

    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("should call onAddAccounts when continue button is clicked", () => {
    const onAddAccounts = jest.fn();
    render(
      <StepCreateFooter
        {...defaultProps}
        onAddAccounts={onAddAccounts}
        onboardingStatus={AccountOnboardStatus.SUCCESS}
      />,
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });
    continueButton.click();

    expect(onAddAccounts).toHaveBeenCalled();
  });

  it("should call onCreateAccount when try again button is clicked", () => {
    const onCreateAccount = jest.fn();
    render(
      <StepCreateFooter
        {...defaultProps}
        onCreateAccount={onCreateAccount}
        onboardingStatus={AccountOnboardStatus.ERROR}
      />,
    );

    const retryButton = screen.getByRole("button", { name: "Try again" });
    retryButton.click();

    expect(onCreateAccount).toHaveBeenCalled();
  });

  it("should display currency badge", () => {
    render(<StepCreateFooter {...defaultProps} />);

    expect(screen.getByText("Concordium")).toBeInTheDocument();
  });
});
