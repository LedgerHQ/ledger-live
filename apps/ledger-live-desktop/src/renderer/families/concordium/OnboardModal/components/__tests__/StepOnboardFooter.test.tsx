import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import StepOnboardFooter from "../StepOnboardFooter";
import { StepProps } from "../../types";
import {
  createMockConcordiumCurrency,
  createMockDevice,
  createMockAccount,
  createMockImportableAccount,
  createMockStepProps,
} from "../../__tests__/testUtils";

describe("StepOnboardFooter", () => {
  const mockCurrency = createMockConcordiumCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockImportableAccount = createMockImportableAccount();

  const defaultProps: StepProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    creatableAccount: mockAccount,
    importableAccounts: [mockImportableAccount],
    onboardingStatus: AccountOnboardStatus.INIT,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render agree button in INIT state", () => {
    const { container } = render(
      <StepOnboardFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.INIT} />,
    );

    const agreeButton = screen.getByRole("button", { name: "Agree" });
    expect(agreeButton).toBeInTheDocument();
    container.remove();
  });

  it("should render continue button in SUCCESS state", () => {
    const { container } = render(
      <StepOnboardFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.SUCCESS} />,
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeInTheDocument();
    container.remove();
  });

  it("should render try again button in ERROR state", () => {
    const { container } = render(
      <StepOnboardFooter {...defaultProps} onboardingStatus={AccountOnboardStatus.ERROR} />,
    );

    const retryButton = screen.getByRole("button", { name: "Try again" });
    expect(retryButton).toBeInTheDocument();
    container.remove();
  });

  it("should call onPair when agree button is clicked", () => {
    const onPair = jest.fn();
    render(
      <StepOnboardFooter
        {...defaultProps}
        onPair={onPair}
        onboardingStatus={AccountOnboardStatus.INIT}
      />,
    );

    const agreeButton = screen.getByRole("button", { name: "Agree" });
    agreeButton.click();

    expect(onPair).toHaveBeenCalled();
  });

  it("should call onCreateAccount when continue button is clicked in SUCCESS state", () => {
    const onCreateAccount = jest.fn();
    render(
      <StepOnboardFooter
        {...defaultProps}
        onCreateAccount={onCreateAccount}
        onboardingStatus={AccountOnboardStatus.SUCCESS}
      />,
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });
    continueButton.click();

    expect(onCreateAccount).toHaveBeenCalled();
  });

  it("should call onPair when try again button is clicked in ERROR state", () => {
    const onPair = jest.fn();
    render(
      <StepOnboardFooter
        {...defaultProps}
        onPair={onPair}
        onboardingStatus={AccountOnboardStatus.ERROR}
      />,
    );

    const retryButton = screen.getByRole("button", { name: "Try again" });
    retryButton.click();

    expect(onPair).toHaveBeenCalled();
  });

  it("should always show cancel button", () => {
    render(<StepOnboardFooter {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeInTheDocument();
  });

  it("should call onCancel when cancel button is clicked", () => {
    const onCancel = jest.fn();
    render(<StepOnboardFooter {...defaultProps} onCancel={onCancel} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    cancelButton.click();

    expect(onCancel).toHaveBeenCalled();
  });
});
