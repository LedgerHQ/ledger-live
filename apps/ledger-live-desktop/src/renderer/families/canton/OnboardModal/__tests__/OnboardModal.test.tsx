/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "tests/testSetup";
import { closeModal, openModal } from "~/renderer/reducers/modals";
import type { NavigationSnapshot } from "../../hooks/topologyChangeError";
import OnboardModal from "../index";
import { StepId } from "../types";
import {
  createMockAccount,
  createMockCantonBridge,
  createMockCantonCurrency,
  createMockDevice,
  createMockImportableAccount,
  createMockObservable,
  createMockUserProps,
  mockOnboardingProgress,
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
jest.mock("~/renderer/reducers/modals", () => ({
  closeModal: jest.fn((name: string) => ({
    type: "MODAL_CLOSE",
    payload: { name },
  })),
  openModal: jest.fn((name: string, data?: unknown) => ({
    type: "MODAL_OPEN",
    payload: { name, data },
  })),
}));
jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  setDrawer: jest.fn(),
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
}));
jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: ({ steps, stepId, onStepChange, onClose, ...props }: any) => {
    const currentStep = steps.find((s: any) => s.id === stepId);
    return (
      <div data-testid="stepper">
        <div>Current Step: {stepId}</div>
        <button onClick={() => onStepChange({ id: StepId.AUTHORIZE })}>Go to Authorize</button>
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
  default: ({ render: renderModal, ...props }: any) => (
    <div data-testid="modal" {...props}>
      {renderModal({ onClose: jest.fn() })}
    </div>
  ),
}));

const mockCantonBridge = createMockCantonBridge();
const mockOpenModal = openModal as jest.MockedFunction<typeof openModal>;
const mockCloseModal = closeModal as jest.MockedFunction<typeof closeModal>;

describe("OnboardModal", () => {
  const mockCurrency = createMockCantonCurrency();
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
    getCurrencyBridge.mockReturnValue(mockCantonBridge);
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

  it("should handle complete onboarding flow", async () => {
    const mockOnboardObservable = createMockObservable([
      mockOnboardingProgress.PREPARE,
      mockOnboardingProgress.SIGN,
      mockOnboardingProgress.SUBMIT,
      mockOnboardingProgress.SUCCESS,
    ]);
    mockCantonBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        devices: { currentDevice: mockDevice, devices: [mockDevice] },
        accounts: { active: [] },
      },
    });

    const onboardButton = await screen.findByRole("button", { name: "common.continue" });
    fireEvent.click(onboardButton);

    await waitFor(() => {
      expect(mockCantonBridge.onboardAccount).toHaveBeenCalledWith(
        mockCurrency,
        mockDevice.deviceId,
        mockAccount,
      );
    });
  });

  it("should handle onboarding errors", async () => {
    const mockOnboardObservable = createMockObservable([
      mockOnboardingProgress.PREPARE,
      mockOnboardingProgress.ERROR,
    ]);
    mockCantonBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

    render(<OnboardModal {...defaultProps} />, {
      initialState: {
        devices: { currentDevice: mockDevice, devices: [mockDevice] },
        accounts: { active: [] },
      },
    });

    const onboardButton = await screen.findByRole("button", { name: "common.continue" });
    fireEvent.click(onboardButton);

    await waitFor(() => {
      expect(mockCantonBridge.onboardAccount).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: "common.tryAgain" })).toBeInTheDocument();
      },
      { timeout: 100 },
    );
  });

  it("should validate required props", () => {
    const testCases = [
      { props: { ...defaultProps, currency: null }, shouldThrow: true },
      { props: { ...defaultProps, device: null }, shouldThrow: true },
      { props: { ...defaultProps, selectedAccounts: [mockImportableAccount] }, shouldThrow: true },
    ];

    testCases.forEach(({ props, shouldThrow }) => {
      if (shouldThrow) {
        expect(() => render(<OnboardModal {...props} />)).toThrow();
      } else {
        expect(() => render(<OnboardModal {...props} />)).not.toThrow();
      }
    });
  });

  describe("re-onboarding", () => {
    it("should restore modal state after successful re-onboarding", async () => {
      const mockOnboardObservable = createMockObservable([
        mockOnboardingProgress.PREPARE,
        mockOnboardingProgress.SIGN,
        mockOnboardingProgress.SUBMIT,
        mockOnboardingProgress.SUCCESS,
      ]);
      mockCantonBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

      const accountToReonboard = createMockAccount({ used: true });
      const navigationSnapshot: NavigationSnapshot = {
        type: "modal",
        modalName: "MODAL_SEND",
        modalData: { account: accountToReonboard },
      };

      const props = createMockUserProps({
        currency: mockCurrency,
        device: mockDevice,
        selectedAccounts: [accountToReonboard],
        isReonboarding: true,
        accountToReonboard,
        navigationSnapshot,
      });

      render(<OnboardModal {...props} />, {
        initialState: {
          devices: { currentDevice: mockDevice, devices: [mockDevice] },
          accounts: { active: [] },
        },
      });

      const onboardButton = await screen.findByRole("button", { name: "common.continue" });
      fireEvent.click(onboardButton);

      await waitFor(() => {
        expect(mockCantonBridge.onboardAccount).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const finishButton = screen.getByRole("button", { name: "Go to Finish" });
      fireEvent.click(finishButton);

      const doneButton = await screen.findByTestId("add-accounts-finish-close-button");
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT");
        expect(mockOpenModal).toHaveBeenCalledWith("MODAL_SEND", { account: accountToReonboard });
      });
    });

    it("should restore transfer-proposal state after successful re-onboarding", async () => {
      const mockOnboardObservable = createMockObservable([
        mockOnboardingProgress.PREPARE,
        mockOnboardingProgress.SIGN,
        mockOnboardingProgress.SUBMIT,
        mockOnboardingProgress.SUCCESS,
      ]);
      mockCantonBridge.onboardAccount.mockReturnValue(mockOnboardObservable);

      const accountToReonboard = createMockAccount({ used: true });
      const mockHandler = jest.fn();
      const navigationSnapshot: NavigationSnapshot = {
        type: "transfer-proposal",
        handler: mockHandler,
        props: {
          action: "accept",
          contractId: "contract-123",
        },
      };

      const props = createMockUserProps({
        currency: mockCurrency,
        device: mockDevice,
        selectedAccounts: [accountToReonboard],
        isReonboarding: true,
        accountToReonboard,
        navigationSnapshot,
      });

      render(<OnboardModal {...props} />, {
        initialState: {
          devices: { currentDevice: mockDevice, devices: [mockDevice] },
          accounts: { active: [] },
        },
      });

      const onboardButton = await screen.findByRole("button", { name: "common.continue" });
      fireEvent.click(onboardButton);

      await waitFor(() => {
        expect(mockCantonBridge.onboardAccount).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const finishButton = screen.getByRole("button", { name: "Go to Finish" });
      fireEvent.click(finishButton);

      const doneButton = await screen.findByTestId("add-accounts-finish-close-button");
      fireEvent.click(doneButton);

      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalledWith("MODAL_CANTON_ONBOARD_ACCOUNT");
        expect(mockHandler).toHaveBeenCalledWith("contract-123", "accept");
      });
    });
  });
});
