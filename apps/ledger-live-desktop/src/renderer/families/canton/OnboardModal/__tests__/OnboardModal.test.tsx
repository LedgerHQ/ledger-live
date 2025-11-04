import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "tests/testSetup";
import OnboardModal from "../index";
import { StepId } from "../types";
import {
  createMockCantonCurrency,
  createMockDevice,
  createMockAccount,
  createMockImportableAccount,
  createMockUserProps,
  createMockCantonBridge,
  createMockObservable,
  mockOnboardingProgress,
} from "./testUtils";

jest.mock("rxjs", () => ({
  Subscription: jest.fn().mockImplementation(() => ({
    unsubscribe: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
    closed: false,
  })),
  Subject: jest.fn().mockImplementation(() => ({
    next: jest.fn(),
    complete: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    asObservable: jest.fn(() => ({
      subscribe: jest.fn(),
    })),
  })),
  Observable: jest.fn(),
  BehaviorSubject: jest.fn().mockImplementation(() => ({
    next: jest.fn(),
    complete: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    getValue: jest.fn(),
    asObservable: jest.fn(() => ({
      subscribe: jest.fn(),
    })),
  })),
  interval: jest.fn(() => ({
    pipe: jest.fn(() => ({
      subscribe: jest.fn(),
    })),
  })),
  from: jest.fn(() => ({
    pipe: jest.fn(() => ({
      subscribe: jest.fn(),
    })),
  })),
  of: jest.fn(() => ({
    pipe: jest.fn(() => ({
      subscribe: jest.fn(),
    })),
  })),
}));
jest.mock("rxjs/operators", () => ({
  switchMap: jest.fn(() => jest.fn()),
  filter: jest.fn(() => jest.fn()),
  share: jest.fn(() => jest.fn()),
  delay: jest.fn(() => jest.fn()),
}));
jest.mock("@ledgerhq/live-wallet/accountName", () => ({
  getDefaultAccountName: jest.fn(account => `${account.currency.name} ${account.index + 1}`),
  getDefaultAccountNameForCurrencyIndex: jest.fn(
    ({ currency, index }) => `${currency.name} ${index + 1}`,
  ),
}));
jest.mock("@ledgerhq/live-wallet/addAccounts", () => ({ addAccountsAction: jest.fn() }));
jest.mock("@ledgerhq/live-common/bridge/index", () => ({ getCurrencyBridge: jest.fn() }));
jest.mock("~/renderer/logger", () => ({
  error: jest.fn(),
  onReduxAction: jest.fn(),
}));
jest.mock("~/renderer/actions/modals", () => ({ closeModal: jest.fn(), openModal: jest.fn() }));
jest.mock("~/renderer/components/Stepper", () => ({
  __esModule: true,
  default: ({
    steps,
    stepId,
    onStepChange,
    onClose,
    ...props
  }: {
    steps: Array<{ id: string; component: React.ComponentType; footer: React.ComponentType }>;
    stepId: string;
    onStepChange: (step: { id: string }) => void;
    onClose: () => void;
  }) => {
    const currentStep = steps.find(s => s.id === stepId);
    return (
      <div data-testid="stepper">
        <div>Current Step: {stepId}</div>
        <div>Steps: {steps.map(step => step.id).join(", ")}</div>
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
  default: ({
    render: renderModal,
    ...props
  }: {
    render: (props: { onClose: () => void }) => React.ReactNode;
  }) => (
    <div data-testid="modal" {...props}>
      {renderModal({ onClose: jest.fn() })}
    </div>
  ),
}));

const mockCantonBridge = createMockCantonBridge();

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
        devices: { currentDevice: mockDevice },
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
        devices: { currentDevice: mockDevice },
        accounts: { active: [] },
      },
    });

    const onboardButton = await screen.findByRole("button", { name: "Continue" });
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
        devices: { currentDevice: mockDevice },
        accounts: { active: [] },
      },
    });

    const onboardButton = await screen.findByRole("button", { name: "Continue" });
    fireEvent.click(onboardButton);

    await waitFor(() => {
      expect(mockCantonBridge.onboardAccount).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
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
});
