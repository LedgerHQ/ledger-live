import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AuthorizeStatus } from "@ledgerhq/coin-canton/types";
import StepAuthorize, { StepAuthorizeFooter } from "../StepAuthorize";
import { StepProps } from "../../types";
import {
  createMockCantonCurrency,
  createMockDevice,
  createMockAccount,
  createMockOnboardingResult,
  createMockStepProps,
} from "../../__tests__/testUtils";

jest.mock("../../components/TransactionConfirm", () => ({
  TransactionConfirm: () => <div data-testid="transaction-confirm" />,
}));

jest.mock("../../components/ValidatorRow", () => ({
  ValidatorRow: () => <div data-testid="validator-row" />,
}));

describe("StepAuthorize", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockOnboardingResult = createMockOnboardingResult({ completedAccount: mockAccount });

  const defaultProps: StepProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    accountName: "Canton 1",
    onboardingResult: mockOnboardingResult,
    authorizeStatus: AuthorizeStatus.INIT,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("should render correct content for each authorization status", () => {
    const statuses = [
      { status: AuthorizeStatus.INIT, expectedText: "Account" },
      { status: AuthorizeStatus.PREPARE, expectedText: "Account" },
      { status: AuthorizeStatus.SIGN, expectedElement: "transaction-confirm" },
      { status: AuthorizeStatus.SUBMIT, expectedText: "Account" },
      { status: AuthorizeStatus.SUCCESS, expectedText: "Account" },
      {
        status: AuthorizeStatus.ERROR,
        expectedText: "Authorization failed. Please try again.",
      },
    ];

    statuses.forEach(({ status, expectedText, expectedElement }) => {
      const { container } = render(<StepAuthorize {...defaultProps} authorizeStatus={status} />);

      if (expectedText) {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
      if (expectedElement) {
        expect(screen.getByTestId(expectedElement)).toBeInTheDocument();
      }
      container.remove();
    });
  });

  it("should display account and validator information", () => {
    render(<StepAuthorize {...defaultProps} />);

    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Authorize")).toBeInTheDocument();
    expect(screen.getByTestId("validator-row")).toBeInTheDocument();
  });

  it("should show correct alert messages based on status", () => {
    const testCases = [
      {
        status: AuthorizeStatus.INIT,
        expectedAlert: "Automaticaly accept incoming funds to this account.",
      },
      {
        status: AuthorizeStatus.ERROR,
        expectedAlert: "Authorization failed. Please try again.",
      },
    ];

    testCases.forEach(({ status, expectedAlert }) => {
      const { container } = render(<StepAuthorize {...defaultProps} authorizeStatus={status} />);

      expect(screen.getByText(expectedAlert)).toBeInTheDocument();
      container.remove();
    });
  });

  it("should throw error when onboardingResult is missing", () => {
    const propsWithoutOnboardingResult = {
      ...defaultProps,
      onboardingResult: undefined,
    };

    expect(() => {
      render(<StepAuthorize {...propsWithoutOnboardingResult} />);
    }).toThrow("canton: completed account is required");
  });

  it("should render correct footer buttons and handle interactions", () => {
    const testCases = [
      { status: AuthorizeStatus.INIT, expectedButton: "Confirm", shouldBeDisabled: false },
      {
        status: AuthorizeStatus.PREPARE,
        expectedButton: "Confirm",
        shouldBeDisabled: false,
      },
      {
        status: AuthorizeStatus.SUBMIT,
        expectedButton: "Confirm",
        shouldBeDisabled: false,
        isProcessing: false,
      },
      {
        status: AuthorizeStatus.SUBMIT,
        expectedButton: "Confirm",
        shouldBeDisabled: false,
        isProcessing: false,
      },
      {
        status: AuthorizeStatus.SUBMIT,
        expectedButton: "Confirm",
        shouldBeDisabled: true,
        isProcessing: true,
      },
      {
        status: AuthorizeStatus.SUCCESS,
        expectedButton: "Confirm",
        shouldBeDisabled: false,
      },
      { status: AuthorizeStatus.ERROR, expectedButton: "Try again", shouldBeDisabled: false },
      { status: AuthorizeStatus.SIGN, expectedButton: null }, // No button for SIGN
    ];

    testCases.forEach(({ status, expectedButton, shouldBeDisabled, isProcessing }) => {
      const { container } = render(
        <StepAuthorizeFooter
          {...defaultProps}
          authorizeStatus={status}
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
    const onAuthorizePreapproval = jest.fn();
    const onRetry = jest.fn();

    // Test INIT status
    const { container: container1 } = render(
      <StepAuthorizeFooter
        {...defaultProps}
        onAuthorizePreapproval={onAuthorizePreapproval}
        authorizeStatus={AuthorizeStatus.INIT}
      />,
    );
    const confirmButton = await screen.findByRole("button", { name: "Confirm" });
    confirmButton.click();
    expect(onAuthorizePreapproval).toHaveBeenCalled();
    container1.remove();

    // Test ERROR status
    const { container: container2 } = render(
      <StepAuthorizeFooter
        {...defaultProps}
        onRetryPreapproval={onRetry}
        authorizeStatus={AuthorizeStatus.ERROR}
      />,
    );
    const retryButton = await screen.findByRole("button", { name: "Try again" });
    retryButton.click();
    expect(onRetry).toHaveBeenCalled();
    container2.remove();
  });

  it("should render currency badge in footer", () => {
    render(<StepAuthorizeFooter {...defaultProps} />);

    expect(screen.getByText("Canton")).toBeInTheDocument();
  });
});
