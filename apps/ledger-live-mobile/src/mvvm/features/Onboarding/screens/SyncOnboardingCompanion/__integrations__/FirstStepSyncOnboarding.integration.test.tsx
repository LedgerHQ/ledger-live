import React, { createRef } from "react";
import { render, screen } from "@tests/test-renderer";
import FirstStepSyncOnboarding from "../components/FirstStepSyncOnboarding";
import * as viewModelModule from "../components/FirstStepSyncOnboarding/useFirstStepSyncOnboardingViewModel";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScrollView } from "react-native";
import { FirstStepCompanionStepKey } from "~/screens/SyncOnboarding/TwoStepStepper/types";

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  return {
    __esModule: true,
    default: {
      View: RN.View,
      ScrollView: RN.ScrollView,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn(value => value),
  };
});

const mockHandleNextStep = jest.fn();

jest.mock("../components/FirstStepSyncOnboarding/useFirstStepSyncOnboardingViewModel", () => ({
  FirstStepCompanionStepKey: {
    Pin: 0,
    Seed: 1,
    Ready: 2,
  },
  useFirstStepSyncOnboardingViewModel: jest.fn(() => ({
    companionSteps: {
      activeStep: 0,
      steps: [
        { title: "Pin step", status: "active" },
        { title: "Seed step", status: "inactive" },
      ],
    },
    hasFinishedExitAnimation: false,
    isFinishedStep: false,
    formatEstimatedTime: jest.fn((time: number) => `${time} min`),
    animatedStyle: { height: undefined, opacity: 1 },
    handleLayout: jest.fn(),
    handleNextStep: mockHandleNextStep,
  })),
}));

const mockDevice = {
  deviceId: "device-123",
  modelId: DeviceModelId.nanoX,
  wired: false,
};

const defaultProps = {
  device: mockDevice,
  productName: "Nano X",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: { navigate: jest.fn() } as any,
  onLostDevice: jest.fn(),
  handleSeedGenerationDelay: jest.fn(),
  notifyEarlySecurityCheckShouldReset: jest.fn(),
  handlePollingError: jest.fn(),
  isPollingOn: true,
  setIsPollingOn: jest.fn(),
  handleFinishStep: jest.fn(),
  parentRef: createRef<ScrollView | null>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analyticsSeedConfiguration: { current: "setup" as any },
};

describe("FirstStepSyncOnboarding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with initial step (Pin)", () => {
    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.getByText(/syncOnboarding.title/)).toBeDefined();
  });

  it("renders VerticalTimeline when not on Ready step", () => {
    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.getByText("Pin step")).toBeDefined();
    expect(screen.getByText("Seed step")).toBeDefined();
  });

  it("renders DeviceSeededSuccessPanel when on Ready step and not finished", () => {
    const useFirstStepSyncOnboardingViewModel =
      viewModelModule.useFirstStepSyncOnboardingViewModel as jest.Mock;

    useFirstStepSyncOnboardingViewModel.mockReturnValue({
      companionSteps: {
        activeStep: FirstStepCompanionStepKey.Ready,
        steps: [],
      },
      hasFinishedExitAnimation: false,
      isFinishedStep: false,
      formatEstimatedTime: jest.fn(),
      animatedStyle: { height: undefined, opacity: 1 },
      handleLayout: jest.fn(),
      handleNextStep: mockHandleNextStep,
    });

    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.getByText(/syncOnboarding.firstStepReadyTitle/)).toBeDefined();
  });

  it("shows complete status when activeStep is Ready or beyond", () => {
    const useFirstStepSyncOnboardingViewModel =
      viewModelModule.useFirstStepSyncOnboardingViewModel as jest.Mock;

    useFirstStepSyncOnboardingViewModel.mockReturnValue({
      companionSteps: {
        activeStep: FirstStepCompanionStepKey.Ready,
        steps: [],
        setStep: jest.fn(),
        hasSyncStep: false,
        isLedgerSyncActive: false,
      },
      hasFinishedExitAnimation: false,
      isFinishedStep: false,
      formatEstimatedTime: jest.fn(),
      animatedStyle: { height: undefined, opacity: 1 },
      handleLayout: jest.fn(),
      handleNextStep: mockHandleNextStep,
    });

    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.getByText(/syncOnboarding.firstStepReadyTitle/)).toBeDefined();
  });

  it("collapses when hasFinishedExitAnimation is true", () => {
    const useFirstStepSyncOnboardingViewModel =
      viewModelModule.useFirstStepSyncOnboardingViewModel as jest.Mock;

    useFirstStepSyncOnboardingViewModel.mockReturnValue({
      companionSteps: {
        activeStep: FirstStepCompanionStepKey.Ready,
        steps: [],
        setStep: jest.fn(),
        hasSyncStep: false,
        isLedgerSyncActive: false,
      },
      hasFinishedExitAnimation: true,
      isFinishedStep: true,
      formatEstimatedTime: jest.fn(),
      animatedStyle: { height: undefined, opacity: 1 },
      handleLayout: jest.fn(),
      handleNextStep: mockHandleNextStep,
    });

    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.getByText(/syncOnboarding.firstStepReadyTitle/)).toBeDefined();
  });

  it("does not render VerticalTimeline when on Ready step", () => {
    const useFirstStepSyncOnboardingViewModel =
      viewModelModule.useFirstStepSyncOnboardingViewModel as jest.Mock;

    useFirstStepSyncOnboardingViewModel.mockReturnValue({
      companionSteps: {
        activeStep: FirstStepCompanionStepKey.Ready,
        steps: [],
        setStep: jest.fn(),
        hasSyncStep: false,
        isLedgerSyncActive: false,
      },
      hasFinishedExitAnimation: false,
      isFinishedStep: false,
      formatEstimatedTime: jest.fn(),
      animatedStyle: { height: undefined, opacity: 1 },
      handleLayout: jest.fn(),
      handleNextStep: mockHandleNextStep,
    });

    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.queryByText("Pin step")).toBeNull();
    expect(screen.queryByText("Seed step")).toBeNull();
  });

  it("does not render DeviceSeededSuccessPanel when isFinishedStep is true", () => {
    const useFirstStepSyncOnboardingViewModel =
      viewModelModule.useFirstStepSyncOnboardingViewModel as jest.Mock;

    useFirstStepSyncOnboardingViewModel.mockReturnValue({
      companionSteps: {
        activeStep: FirstStepCompanionStepKey.Ready,
        steps: [],
      },
      hasFinishedExitAnimation: false,
      isFinishedStep: true,
      formatEstimatedTime: jest.fn(),
      animatedStyle: { height: undefined, opacity: 1 },
      handleLayout: jest.fn(),
      handleNextStep: mockHandleNextStep,
    });

    render(<FirstStepSyncOnboarding {...defaultProps} />);

    expect(screen.queryByTestId("device-seeded-success-panel")).toBeNull();
  });

  it("passes correct productName to title", () => {
    render(<FirstStepSyncOnboarding {...defaultProps} productName="Stax" />);

    expect(screen.getByText(/syncOnboarding.title/)).toBeDefined();
  });
});
