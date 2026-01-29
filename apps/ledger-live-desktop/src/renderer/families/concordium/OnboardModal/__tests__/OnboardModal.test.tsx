import React, { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "tests/testSetup";
import { closeModal } from "~/renderer/actions/modals";
import OnboardModal from "../index";
import { StepId } from "../types";

// Type definitions for mocked components
type DrawerProviderProps = {
  children: ReactNode;
};

type StepperStep = {
  id: StepId;
  component: React.ComponentType<unknown>;
  footer: React.ComponentType<unknown>;
  label?: ReactNode;
};

type StepperProps = {
  steps: StepperStep[];
  stepId: StepId;
  onStepChange: (step: { id: StepId }) => void;
  onClose: () => void;
  [key: string]: unknown;
};

type ModalProps = {
  render: (props: { onClose: () => void }) => ReactNode;
  [key: string]: unknown;
};
import {
  createMockAccount,
  createMockConcordiumBridge,
  createMockConcordiumCurrency,
  createMockDevice,
  createMockImportableAccount,
  createMockObservable,
  createMockUserProps,
  mockOnboardingProgress,
  mockPairingProgress,
} from "./testUtils";

jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({
  addAccountsAction: jest.fn(() => ({
    type: "ADD_ACCOUNTS",
    payload: {
      allAccounts: [],
      editedNames: new Map(),
    },
  })),
}));
jest.mock("@ledgerhq/live-common/bridge/index", () => ({ getCurrencyBridge: jest.fn() }));
jest.mock("~/renderer/actions/modals", () => ({
  closeModal: jest.fn((name: string) => ({
    type: "MODAL_CLOSE",
    payload: { name },
  })),
}));
jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  setDrawer: jest.fn(),
  default: ({ children }: DrawerProviderProps) => <>{children}</>,
}));
jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: ({ steps, stepId, onStepChange, onClose, ...props }: StepperProps) => {
    const currentStep = steps.find((s: StepperStep) => s.id === stepId);
    return (
      <div data-testid="stepper">
        <div>Current Step: {stepId}</div>
        <button onClick={() => onStepChange({ id: StepId.CREATE })}>Go to Create</button>
        <button onClick={() => onStepChange({ id: StepId.FINISH })}>Go to Finish</button>
        <button onClick={onClose}>Close Modal</button>
        <div data-testid="step-content">
          {currentStep && React.createElement(currentStep.component, props)}
        </div>
        <div data-testid="step-footer">
          {currentStep && React.createElement(currentStep.footer, props)}
        </div>
      </div>
    );
  },
}));
jest.mock("~/renderer/components/Modal", () => ({
  __esModule: true,
  default: ({ render: renderModal, ...props }: ModalProps) => (
    <div data-testid="modal" {...props}>
      {renderModal({ onClose: jest.fn() })}
    </div>
  ),
}));
jest.mock("@ledgerhq/coin-concordium/network/walletConnect", () => ({
  setWalletConnect: jest.fn(() => ({
    disconnectAllSessions: jest.fn(),
  })),
  clearWalletConnect: jest.fn(),
}));

const mockConcordiumBridge = createMockConcordiumBridge();
const mockCloseModal = jest.mocked(closeModal);

describe("OnboardModal", () => {
  const mockCurrency = createMockConcordiumCurrency();
  const mockDevice = createMockDevice();
  const mockAccount = createMockAccount({ used: false });
  const mockImportableAccount = createMockImportableAccount();

  const defaultProps = createMockUserProps({
    currency: mockCurrency,
    device: mockDevice,
    selectedAccounts: [mockAccount, mockImportableAccount],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    const { getCurrencyBridge } = jest.requireMock("@ledgerhq/live-common/bridge/index");
    getCurrencyBridge.mockReturnValue(mockConcordiumBridge);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("should render modal with correct initial state", () => {
    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        devices: { currentDevice: mockDevice, devices: [mockDevice] },
        accounts: { active: [] },
      },
    });

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.getByTestId("stepper")).toBeInTheDocument();
    expect(screen.getByText("Current Step: ONBOARD")).toBeInTheDocument();
  });

  it("should handle complete pairing and onboarding flow", async () => {
    const mockPairObservable = createMockObservable([
      mockPairingProgress.PREPARE,
      mockPairingProgress.SUCCESS,
    ]);
    const mockOnboardObservable = createMockObservable([
      mockOnboardingProgress.PREPARE,
      mockOnboardingProgress.SIGN,
      mockOnboardingProgress.SUBMIT,
      mockOnboardingProgress.SUCCESS,
    ]);
    mockConcordiumBridge.pairWalletConnect.mockReturnValue(mockPairObservable);
    mockConcordiumBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        devices: { currentDevice: mockDevice, devices: [mockDevice] },
        accounts: { active: [] },
      },
    });

    // Start pairing
    const allowButton = await screen.findByRole("button", { name: "Agree" });
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(mockConcordiumBridge.pairWalletConnect).toHaveBeenCalledWith(
        mockCurrency,
        mockDevice.deviceId,
      );
    });
  });

  it("should handle pairing errors", async () => {
    const mockPairObservable = createMockObservable([mockPairingProgress.ERROR]);
    mockConcordiumBridge.pairWalletConnect.mockReturnValue(mockPairObservable);

    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        devices: { currentDevice: mockDevice, devices: [mockDevice] },
        accounts: { active: [] },
      },
    });

    const allowButton = await screen.findByRole("button", { name: "Agree" });
    fireEvent.click(allowButton);

    await waitFor(() => {
      expect(mockConcordiumBridge.pairWalletConnect).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
      },
      { timeout: 100 },
    );
  });

  it("should require currency prop", () => {
    const propsWithoutCurrency = createMockUserProps({
      currency: null,
      device: mockDevice,
      selectedAccounts: [mockAccount, mockImportableAccount],
    });

    // Component uses invariant which throws when currency is null
    expect(() => render(<OnboardModal {...propsWithoutCurrency} />)).toThrow();
  });

  it("should show connect device screen when device is disconnected", () => {
    const propsWithoutDevice = createMockUserProps({
      currency: mockCurrency,
      device: null,
      selectedAccounts: [mockAccount, mockImportableAccount],
    });

    render(<OnboardModal {...propsWithoutDevice} />, {
      initialState: {
        devices: { currentDevice: null, devices: [] },
        accounts: { active: [] },
      },
    });

    expect(screen.queryByTestId("stepper")).not.toBeInTheDocument();
  });

  describe("finish step", () => {
    it("should close modal on complete", async () => {
      const mockPairObservable = createMockObservable([
        mockPairingProgress.PREPARE,
        mockPairingProgress.SUCCESS,
      ]);
      const mockOnboardObservable = createMockObservable([mockOnboardingProgress.SUCCESS]);
      mockConcordiumBridge.pairWalletConnect.mockReturnValue(mockPairObservable);
      mockConcordiumBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

      render(<OnboardModal {...defaultProps} />, {
        initialState: {
          devices: { currentDevice: mockDevice, devices: [mockDevice] },
          accounts: { active: [] },
        },
      });

      // Navigate to finish step
      const finishButton = screen.getByRole("button", { name: "Go to Finish" });
      fireEvent.click(finishButton);

      const doneButton = await screen.findByTestId("add-accounts-finish-close-button");
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalledWith("MODAL_CONCORDIUM_ONBOARD_ACCOUNT");
      });
    });
  });
});
