import React from "react";
import { render, screen, cleanup } from "tests/testSetup";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import StepOnboard from "../StepOnboard";
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
  });

  afterEach(() => {
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

  it("should display user refused error message", () => {
    const { UserRefusedOnDevice } = jest.requireActual("@ledgerhq/errors");
    const userRefusedError = new UserRefusedOnDevice();
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.ERROR,
      error: userRefusedError,
    };

    render(<StepOnboard {...props} />);

    // The error message is displayed via Trans component with error.message as i18nKey
    expect(screen.getByText(userRefusedError.message)).toBeInTheDocument();
  });

  it("should display locked device error message", () => {
    const { LockedDeviceError } = jest.requireActual("@ledgerhq/errors");
    const lockedError = new LockedDeviceError();
    const props = {
      ...defaultProps,
      onboardingStatus: AccountOnboardStatus.ERROR,
      error: lockedError,
    };

    render(<StepOnboard {...props} />);

    // The error message is displayed via Trans component with error.message as i18nKey
    expect(screen.getByText(lockedError.message)).toBeInTheDocument();
  });

  it("should display app store links when showing QR code", () => {
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.PREPARE,
      walletConnectUri: "wc:test-uri",
    };

    render(<StepOnboard {...props} />);

    expect(screen.getByAltText("Get it on Google Play")).toBeInTheDocument();
    expect(screen.getByAltText("Get it on Apple Store")).toBeInTheDocument();
  });

  it("should open Play Store when Google Play link is clicked", () => {
    const { openURL } = jest.requireMock("~/renderer/linking");
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.PREPARE,
      walletConnectUri: "wc:test-uri",
    };

    render(<StepOnboard {...props} />);

    const playStoreLink = screen.getByAltText("Get it on Google Play").closest("a");
    playStoreLink?.click();

    expect(openURL).toHaveBeenCalled();
  });

  it("should open App Store when Apple Store link is clicked", () => {
    const { openURL } = jest.requireMock("~/renderer/linking");
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.PREPARE,
      walletConnectUri: "wc:test-uri",
    };

    render(<StepOnboard {...props} />);

    const appStoreLink = screen.getByAltText("Get it on Apple Store").closest("a");
    appStoreLink?.click();

    expect(openURL).toHaveBeenCalled();
  });

  it("should open learn more link when clicked in QR code view", () => {
    const { openURL } = jest.requireMock("~/renderer/linking");
    const props = {
      ...defaultProps,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.PREPARE,
      walletConnectUri: "wc:test-uri",
    };

    render(<StepOnboard {...props} />);

    // Find the learn more link in the QR code section
    const learnMoreLink = screen.getByText(/learn more/i);
    learnMoreLink.click();

    expect(openURL).toHaveBeenCalled();
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
});
