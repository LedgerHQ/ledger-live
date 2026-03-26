import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import React from "react";
import { render, screen } from "tests/testSetup";
import {
  createMockAccount,
  createMockCantonCurrency,
  createMockDevice,
  createMockImportableAccount,
  createMockStepProps,
} from "../../__tests__/testUtils";
import { StepId } from "../../types";
import StepOnboard, { StepOnboardFooter } from "../StepOnboard";

describe("StepOnboard", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockImportableAccount = createMockImportableAccount();

  const defaultProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    creatableAccount: mockAccount,
    importableAccounts: [mockImportableAccount],
    onboardingStatus: OnboardStatus.INIT,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hide importable accounts section when none exist", () => {
    render(<StepOnboard {...defaultProps} importableAccounts={[]} />);
    expect(screen.queryByText(/onboarded accounts/i)).not.toBeInTheDocument();
    expect(screen.getByText(/new account/i)).toBeInTheDocument();
  });

  it("should show importable accounts section when they exist", () => {
    render(<StepOnboard {...defaultProps} />);
    expect(screen.getByText(/onboarded accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/new account/i)).toBeInTheDocument();
  });

  it.each([
    {
      status: OnboardStatus.INIT,
      expectedButton: /continue/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: OnboardStatus.SUCCESS,
      expectedButton: /continue/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: OnboardStatus.ERROR,
      expectedButton: /try again/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: OnboardStatus.PREPARE,
      expectedButton: /continue/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: OnboardStatus.PREPARE,
      expectedButton: /continue/i,
      isProcessing: true,
      disabled: true,
    },
  ])(
    "should render $expectedButton button (disabled=$disabled) when status=$status",
    ({ status, expectedButton, isProcessing, disabled }) => {
      render(
        <StepOnboardFooter
          {...defaultProps}
          onboardingStatus={status}
          isProcessing={isProcessing}
        />,
      );
      const button = screen.getByRole("button", { name: expectedButton });
      if (disabled) {
        expect(button).toBeDisabled();
      } else {
        expect(button).not.toBeDisabled();
      }
    },
  );

  it("should render no button during SIGN status", () => {
    render(<StepOnboardFooter {...defaultProps} onboardingStatus={OnboardStatus.SIGN} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should call onOnboardAccount when continue is clicked in INIT state", async () => {
    const onOnboardAccount = jest.fn();
    const { user } = render(
      <StepOnboardFooter
        {...defaultProps}
        onOnboardAccount={onOnboardAccount}
        onboardingStatus={OnboardStatus.INIT}
      />,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(onOnboardAccount).toHaveBeenCalled();
  });

  it("should call onRetryOnboardAccount when retry is clicked in ERROR state", async () => {
    const onRetry = jest.fn();
    const { user } = render(
      <StepOnboardFooter
        {...defaultProps}
        onRetryOnboardAccount={onRetry}
        onboardingStatus={OnboardStatus.ERROR}
      />,
    );

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("should call transitionTo with AUTHORIZE when continue is clicked in SUCCESS state", async () => {
    const transitionTo = jest.fn();
    const { user } = render(
      <StepOnboardFooter
        {...defaultProps}
        transitionTo={transitionTo}
        onboardingStatus={OnboardStatus.SUCCESS}
      />,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(transitionTo).toHaveBeenCalledWith(StepId.AUTHORIZE);
  });

  it("should render currency badge in footer", () => {
    render(<StepOnboardFooter {...defaultProps} />);
    expect(screen.getByText("Canton")).toBeInTheDocument();
  });
});
