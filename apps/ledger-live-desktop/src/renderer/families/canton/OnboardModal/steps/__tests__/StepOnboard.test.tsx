import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import StepOnboard, { StepOnboardFooter } from "../StepOnboard";
import { StepProps, StepId } from "../../types";
import {
  createMockCantonCurrency,
  createMockDevice,
  createMockAccount,
  createMockImportableAccount,
  createMockStepProps,
} from "../../__tests__/testUtils";

jest.mock("@ledgerhq/live-wallet/accountName", () => ({
  getDefaultAccountNameForCurrencyIndex: jest.fn(
    ({ currency, index }) => `${currency.name} ${index + 1}`,
  ),
}));
jest.mock("../../components/TransactionConfirm", () => ({
  TransactionConfirm: () => <div data-testid="transaction-confirm" />,
}));

describe("StepOnboard", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockImportableAccount = createMockImportableAccount();

  const defaultProps: StepProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    creatableAccount: mockAccount,
    importableAccounts: [mockImportableAccount],
    onboardingStatus: OnboardStatus.INIT,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("should display accounts correctly based on availability", () => {
    const testCases = [
      { importableAccounts: [], creatableAccount: mockAccount, expectImportable: false },
      {
        importableAccounts: [mockImportableAccount],
        creatableAccount: mockAccount,
        expectImportable: true,
      },
    ];

    testCases.forEach(({ importableAccounts, creatableAccount, expectImportable }) => {
      const props = { ...defaultProps, importableAccounts, creatableAccount };
      const { container } = render(<StepOnboard {...props} />);

      if (expectImportable) {
        expect(screen.getByText("Onboarded accounts")).toBeInTheDocument();
      } else {
        expect(screen.queryByText("Onboarded accounts")).not.toBeInTheDocument();
      }
      expect(screen.getByText("New Account")).toBeInTheDocument();
      container.remove();
    });
  });

  it("should render correct footer buttons and handle interactions", () => {
    const testCases = [
      { status: OnboardStatus.INIT, expectedButton: "Continue", shouldBeDisabled: false },
      { status: OnboardStatus.SUCCESS, expectedButton: "Continue", shouldBeDisabled: false },
      { status: OnboardStatus.ERROR, expectedButton: "Try again", shouldBeDisabled: false },
      {
        status: OnboardStatus.PREPARE,
        expectedButton: "Continue",
        shouldBeDisabled: false,
        isProcessing: false,
      },
      {
        status: OnboardStatus.PREPARE,
        expectedButton: "Continue",
        shouldBeDisabled: true,
        isProcessing: true,
      },
      { status: OnboardStatus.SIGN, expectedButton: null }, // No button for SIGN
    ];

    testCases.forEach(({ status, expectedButton, shouldBeDisabled, isProcessing }) => {
      const { container } = render(
        <StepOnboardFooter
          {...defaultProps}
          onboardingStatus={status}
          isProcessing={!!isProcessing}
        />,
      );

      if (expectedButton) {
        const button = screen.getByRole("button", { name: expectedButton });
        expect(button).toBeInTheDocument();
        if (shouldBeDisabled) {
          expect(button).toBeDisabled();
        } else {
          expect(button).not.toBeDisabled();
        }
      } else {
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
      }
      container.remove();
    });
  });

  it("should call correct handlers on button clicks", async () => {
    const onOnboardAccount = jest.fn();
    const onRetry = jest.fn();
    const transitionTo = jest.fn();

    // Test INIT status
    const { container: container1 } = render(
      <StepOnboardFooter
        {...defaultProps}
        onOnboardAccount={onOnboardAccount}
        onboardingStatus={OnboardStatus.INIT}
      />,
    );
    const continueButton = await screen.findByRole("button", { name: "Continue" });
    continueButton.click();
    expect(onOnboardAccount).toHaveBeenCalled();
    container1.remove();

    // Test ERROR status
    const { container: container2 } = render(
      <StepOnboardFooter
        {...defaultProps}
        onRetryOnboardAccount={onRetry}
        onboardingStatus={OnboardStatus.ERROR}
      />,
    );
    const retryButton = await screen.findByRole("button", { name: "Try again" });
    retryButton.click();
    expect(onRetry).toHaveBeenCalled();
    container2.remove();

    // Test SUCCESS status
    const { container: container3 } = render(
      <StepOnboardFooter
        {...defaultProps}
        transitionTo={transitionTo}
        onboardingStatus={OnboardStatus.SUCCESS}
      />,
    );
    const successButton = await screen.findByRole("button", { name: "Continue" });
    successButton.click();
    expect(transitionTo).toHaveBeenCalledWith(StepId.AUTHORIZE);
    container3.remove();
  });

  it("should render currency badge in footer", () => {
    render(<StepOnboardFooter {...defaultProps} />);

    expect(screen.getByText("Canton")).toBeInTheDocument();
  });
});
