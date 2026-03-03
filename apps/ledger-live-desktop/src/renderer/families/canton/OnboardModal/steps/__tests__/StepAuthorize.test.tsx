import { AuthorizeStatus } from "@ledgerhq/coin-canton/types";
import React from "react";
import { render, screen } from "tests/testSetup";
import {
  createMockAccount,
  createMockCantonCurrency,
  createMockDevice,
  createMockOnboardingResult,
  createMockStepProps,
} from "../../__tests__/testUtils";
import StepAuthorize, { StepAuthorizeFooter } from "../StepAuthorize";

describe("StepAuthorize", () => {
  const mockCurrency = createMockCantonCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount();
  const mockOnboardingResult = createMockOnboardingResult({ completedAccount: mockAccount });

  const defaultProps = createMockStepProps({
    device: mockDevice,
    currency: mockCurrency,
    accountName: "Canton 1",
    onboardingResult: mockOnboardingResult,
    authorizeStatus: AuthorizeStatus.INIT,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    { status: AuthorizeStatus.INIT, expectedText: "Account" },
    { status: AuthorizeStatus.PREPARE, expectedText: "Account" },
    { status: AuthorizeStatus.SIGN, expectedText: "Sign transaction on your Ledger Device" },
    { status: AuthorizeStatus.SUBMIT, expectedText: "Account" },
    { status: AuthorizeStatus.SUCCESS, expectedText: "Account" },
    { status: AuthorizeStatus.ERROR, expectedText: "Authorization failed. Please try again." },
  ])(
    "should render correct content when authorizeStatus is $status",
    ({ status, expectedText }) => {
      render(<StepAuthorize {...defaultProps} authorizeStatus={status} />);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    },
  );

  it("should display account and validator information", () => {
    render(<StepAuthorize {...defaultProps} />);
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Authorize")).toBeInTheDocument();
    expect(screen.getByText("Ledger Validator")).toBeInTheDocument();
  });

  it.each([
    {
      status: AuthorizeStatus.INIT,
      expectedAlert: "Automaticaly accept incoming funds to this account.",
    },
    { status: AuthorizeStatus.ERROR, expectedAlert: "Authorization failed. Please try again." },
  ])("should show correct alert when authorizeStatus is $status", ({ status, expectedAlert }) => {
    render(<StepAuthorize {...defaultProps} authorizeStatus={status} />);
    expect(screen.getByText(expectedAlert)).toBeInTheDocument();
  });

  it("should throw error when onboardingResult is missing", () => {
    expect(() => {
      render(<StepAuthorize {...defaultProps} onboardingResult={undefined} />);
    }).toThrow("canton: completed account is required");
  });

  it.each([
    {
      status: AuthorizeStatus.INIT,
      expectedButton: /confirm/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: AuthorizeStatus.PREPARE,
      expectedButton: /confirm/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: AuthorizeStatus.SUBMIT,
      expectedButton: /confirm/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: AuthorizeStatus.SUBMIT,
      expectedButton: /confirm/i,
      isProcessing: true,
      disabled: true,
    },
    {
      status: AuthorizeStatus.SUCCESS,
      expectedButton: /confirm/i,
      isProcessing: false,
      disabled: false,
    },
    {
      status: AuthorizeStatus.ERROR,
      expectedButton: /try again/i,
      isProcessing: false,
      disabled: false,
    },
  ])(
    "should render $expectedButton button (disabled=$disabled) when authorizeStatus=$status",
    ({ status, expectedButton, isProcessing, disabled }) => {
      render(
        <StepAuthorizeFooter
          {...defaultProps}
          authorizeStatus={status}
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
    render(<StepAuthorizeFooter {...defaultProps} authorizeStatus={AuthorizeStatus.SIGN} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should call onAuthorizePreapproval when confirm is clicked", async () => {
    const onAuthorizePreapproval = jest.fn();
    const { user } = render(
      <StepAuthorizeFooter
        {...defaultProps}
        onAuthorizePreapproval={onAuthorizePreapproval}
        authorizeStatus={AuthorizeStatus.INIT}
      />,
    );

    await user.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onAuthorizePreapproval).toHaveBeenCalled();
  });

  it("should call onRetryPreapproval when retry is clicked in ERROR state", async () => {
    const onRetry = jest.fn();
    const { user } = render(
      <StepAuthorizeFooter
        {...defaultProps}
        onRetryPreapproval={onRetry}
        authorizeStatus={AuthorizeStatus.ERROR}
      />,
    );

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("should render currency badge in footer", () => {
    render(<StepAuthorizeFooter {...defaultProps} />);
    expect(screen.getByText("Canton")).toBeInTheDocument();
  });
});
