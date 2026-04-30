import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import { of, throwError } from "rxjs";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import OnboardModal from "../index";
import { createMockAccount, createMockDevice, createMockUserProps } from "./testUtils";

const mockOnboardAccount = jest.fn();
const mockAuthorizePreapproval = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  getCurrencyBridge: jest.fn(() =>
    Promise.resolve({
      onboardAccount: mockOnboardAccount,
      authorizePreapproval: mockAuthorizePreapproval,
    }),
  ),
}));

describe("OnboardModal", () => {
  const mockDevice = createMockDevice();
  const defaultProps = createMockUserProps();

  const initialState = {
    devices: {
      currentDevice: mockDevice,
      devices: [mockDevice],
    },
    modals: {
      MODAL_CANTON_ONBOARD_ACCOUNT: { isOpened: true },
    },
  };

  beforeAll(() => {
    const modalsDiv = document.createElement("div");
    modalsDiv.id = "modals";
    document.body.appendChild(modalsDiv);
  });

  afterAll(() => {
    document.getElementById("modals")?.remove();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render modal with correct initial state", () => {
    render(<OnboardModal {...defaultProps} />, { initialState });
    expect(screen.getByTestId("modal-container")).toBeInTheDocument();
  });

  it("should show onboard step content by default", () => {
    render(<OnboardModal {...defaultProps} />, { initialState });
    expect(
      screen.getByText("Set up your new Canton account by clicking Continue"),
    ).toBeInTheDocument();
  });

  it("should render reonboarding title when isReonboarding", () => {
    render(<OnboardModal {...defaultProps} isReonboarding />, { initialState });
    expect(screen.getByText("Account Update Required")).toBeInTheDocument();
  });

  it("should render normal title when not reonboarding", () => {
    render(<OnboardModal {...defaultProps} />, { initialState });
    expect(screen.getByText("Add Canton Account")).toBeInTheDocument();
  });

  it("should call bridge.onboardAccount when continue is clicked", async () => {
    mockOnboardAccount.mockReturnValue(of({ status: OnboardStatus.SUBMIT }));
    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(mockOnboardAccount).toHaveBeenCalledWith(
      defaultProps.currency,
      mockDevice.deviceId,
      expect.objectContaining({ used: false }),
    );
  });

  it("should show retry button when onboarding error occurs", async () => {
    mockOnboardAccount.mockReturnValue(throwError(() => new Error("Onboarding failed")));
    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });
  });

  it("should show finish step when onboarding succeeds", async () => {
    const completedAccount = createMockAccount({ freshAddress: "completed-addr" });
    mockOnboardAccount.mockReturnValue(of({ partyId: "test-party", account: completedAccount }));

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByTestId("add-accounts-finish-close-button")).toBeInTheDocument();
    });
  });
});
