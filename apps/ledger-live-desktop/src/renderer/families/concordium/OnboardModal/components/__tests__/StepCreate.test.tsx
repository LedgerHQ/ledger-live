import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import StepCreate from "../StepCreate";
import { StepProps } from "../../types";
import {
  createMockConcordiumCurrency,
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
jest.mock("../TransactionConfirm", () => ({
  TransactionConfirm: () => <div data-testid="transaction-confirm" />,
}));

describe("StepCreate", () => {
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

  it("should display confirmation code when in PREPARE state", () => {
    render(<StepCreate {...defaultProps} />);

    // Check for the translated title text
    expect(screen.getByText(/match the code below in the Concordium ID App/)).toBeVisible();
    // Check each digit is displayed
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("should display transaction confirm component in SIGN state", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.SIGN,
    };

    render(<StepCreate {...props} />);

    expect(screen.getByTestId("transaction-confirm")).toBeInTheDocument();
  });

  it("should display success message when account creation succeeds", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.SUCCESS,
    };

    render(<StepCreate {...props} />);

    expect(
      screen.getByText("Your Concordium account has been created successfully."),
    ).toBeInTheDocument();
  });

  it("should display error message when account creation fails", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.ERROR,
      error: new Error("Creation failed"),
    };

    render(<StepCreate {...props} />);

    expect(screen.getByText("Failed to create account. Please try again.")).toBeInTheDocument();
  });

  it("should display loading state in SUBMIT state", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.SUBMIT,
      confirmationCode: null,
    };

    render(<StepCreate {...props} />);

    expect(screen.getByText("Creating account...")).toBeInTheDocument();
  });
});
