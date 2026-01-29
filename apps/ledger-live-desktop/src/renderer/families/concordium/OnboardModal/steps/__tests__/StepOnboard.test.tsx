import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import StepOnboard, { StepOnboardFooter } from "../StepOnboard";
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
jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: jest.fn(() => "https://example.com"),
}));
jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("StepOnboard", () => {
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
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("should display acknowledgment screen in INIT state when not pairing", () => {
    render(<StepOnboard {...defaultProps} isPairing={false} />);

    // "Acknowledgement" is the translated title
    expect(screen.getByText("Acknowledgement")).toBeInTheDocument();
  });

  it("should display QR code when pairing with walletConnectUri", () => {
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.PREPARE,
      walletConnectUri: "wc:test-uri",
    };

    render(<StepOnboard {...props} />);

    // Check for QR code related text
    expect(screen.getByText(/Scan the QR code/)).toBeInTheDocument();
  });

  it("should display success message when pairing succeeds", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.SUCCESS,
      sessionTopic: "test-session-topic",
    };

    render(<StepOnboard {...props} />);

    expect(screen.getByText("Successfully connected to Concordium ID App.")).toBeInTheDocument();
  });

  it("should display error message when pairing fails", () => {
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.ERROR,
      error: new Error("Pairing failed"),
    };

    render(<StepOnboard {...props} />);

    expect(
      screen.getByText("Failed to onboard new account. Please try again."),
    ).toBeInTheDocument();
  });

  it("should display loading state while connecting", () => {
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.INIT,
    };

    render(<StepOnboard {...props} />);

    expect(screen.getByText("Connecting to Concordium ID App...")).toBeInTheDocument();
  });

  describe("StepOnboardFooter", () => {
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
});
